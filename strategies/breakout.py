"""
breakout.py — Statistical breakout strategy for Polymarket binary options.
This is the INITIAL strategy the auto-research loop starts with.
EDITABLE by the auto-research loop — any parameter or logic change is fair game.

Based on prediction-market-backtesting's BookBreakoutStrategy.
"""

from decimal import Decimal
from collections import deque

from nautilus_trader.trading.strategy import Strategy
from nautilus_trader.config import StrategyConfig
from nautilus_trader.model.data import OrderBookDelta
from nautilus_trader.model.identifiers import InstrumentId
from nautilus_trader.model.enums import OrderSide


class BreakoutConfig(StrategyConfig, frozen=True):
    instrument_id: str = ""
    trade_size: Decimal = Decimal(5)
    window: int = 120
    breakout_std: float = 1.5
    breakout_buffer: float = 0.001
    mean_reversion_buffer: float = 0.0005
    min_holding_periods: int = 20
    reentry_cooldown: int = 80
    max_entry_price: float = 0.92
    take_profit: float = 0.015
    stop_loss: float = 0.02
    min_tick_size: float = 0.0001


class BreakoutStrategy(Strategy):
    """
    Statistical breakout strategy:
    - Tracks rolling mean + std of midprices
    - Enters when price breaks above mean + N*std
    - Exits when price reverts to mean
    """

    def __init__(self, config: BreakoutConfig):
        super().__init__(config)
        self.config = config
        self.instrument_id = InstrumentId.from_str(config.instrument_id)

        self.prices = deque(maxlen=config.window)
        self.holding_periods = 0
        self.entries = 0
        self.max_entries = 1
        self.cooldown = 0

        self._entry_price = None
        self._in_position = False
        self._pending = False

    def on_start(self):
        self.subscribe_order_book_deltas(self.instrument_id)

    def on_order_book_deltas(self, deltas: list[OrderBookDelta]):
        if self._pending:
            return

        book = self.cache.order_book(self.instrument_id)
        if book is None or book.best_bid_price() is None or book.best_ask_price() is None:
            return

        bid = float(book.best_bid_price())
        ask = float(book.best_ask_price())
        mid = (bid + ask) / 2

        self.prices.append(mid)

        if len(self.prices) < self.config.window:
            return

        if self._in_position:
            self.holding_periods += 1
        if self.cooldown > 0:
            self.cooldown -= 1

        mean = sum(self.prices) / len(self.prices)
        variance = sum((p - mean) ** 2 for p in self.prices) / len(self.prices)
        std = variance ** 0.5

        breakout_level = mean + self.config.breakout_std * std + self.config.breakout_buffer

        if not self._in_position and self.cooldown == 0:
            if mid >= breakout_level and bid <= self.config.max_entry_price:
                self._enter(mid)
                return

        if self._in_position and self.holding_periods >= self.config.min_holding_periods:
            if self._entry_price and mid >= self._entry_price + self.config.take_profit:
                self._exit()
                return

            if self._entry_price and mid <= self._entry_price - self.config.stop_loss:
                self._exit()
                return

            if mid <= mean - self.config.mean_reversion_buffer:
                self._exit()
                return

    def _enter(self, mid: float):
        quantity = self._entry_quantity()
        if quantity <= 0:
            return

        self._pending = True
        self.submit_order(
            self.order_factory.market(
                instrument_id=self.instrument_id,
                order_side=OrderSide.BUY,
                quantity=quantity,
                time_in_force="IOC",
            )
        )

    def _exit(self):
        if not self._in_position:
            return

        self._pending = True
        position = self.cache.positions(self.instrument_id)[0]
        self.submit_order(
            self.order_factory.market(
                instrument_id=self.instrument_id,
                order_side=OrderSide.SELL,
                quantity=position.quantity,
                time_in_force="IOC",
                reduce_only=True,
            )
        )

    def _entry_quantity(self) -> Decimal:
        free = self.cache.account(self.instrument_id.venue).balance()
        if free is None or free.as_double() <= 0:
            return Decimal(0)

        max_by_balance = free.as_double() * 0.97
        qty = min(float(self.config.trade_size), max_by_balance)
        return Decimal(str(round(qty, 4)))

    def on_order_filled(self, order_fill):
        if order_fill.order_side == OrderSide.BUY:
            self._entry_price = float(order_fill.fill_price)
            self._in_position = True
            self._pending = False
            self.holding_periods = 0
        elif order_fill.order_side == OrderSide.SELL:
            self._in_position = False
            self._pending = False
            self._entry_price = None
            self.entries += 1
            self.cooldown = self.config.reentry_cooldown

    def on_order_rejected(self, order):
        self._pending = False

    def on_stop(self):
        for order in self.cache.orders():
            self.cancel_order(order.client_order_id)

    def on_reset(self):
        self.prices.clear()
        self.holding_periods = 0
        self.entries = 0
        self.cooldown = 0
        self._entry_price = None
        self._in_position = False
        self._pending = False
