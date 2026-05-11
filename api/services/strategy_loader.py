"""
Strategy loader service.

Discovers nautilus_trader strategies from a directory,
extracts parameter schemas via AST analysis,
and provides access to strategy metadata and source code.
"""

from __future__ import annotations

import ast
import importlib.util
import shutil
import sys
from pathlib import Path
from typing import Optional


class StrategyLoader:
    """Discovers and loads nautilus_trader strategies from a directory."""

    def __init__(self, strategies_dir: str = "strategies"):
        self.strategies_dir = Path(strategies_dir).resolve()
        if str(self.strategies_dir.parent) not in sys.path:
            sys.path.insert(0, str(self.strategies_dir.parent))

    def list_strategies(self) -> list[dict]:
        """
        List all discovered strategies.

        Returns list of dicts with keys: name, description, file_path, backtest_count.
        """
        results = []
        for file_path in self._discover_strategy_files():
            metadata = self._parse_strategy_metadata(file_path)
            if metadata:
                results.append(metadata)
        return results

    def get_strategy_detail(self, name: str) -> Optional[dict]:
        """
        Get full strategy details including params schema and source code.

        Returns dict with keys: name, description, params, source, backtest_count.
        """
        file_path = self._find_strategy_file(name)
        if file_path is None:
            return None

        metadata = self._parse_strategy_metadata(file_path)
        if metadata is None:
            return None

        params = self.get_strategy_params(name)
        source = self.get_strategy_source(name)

        return {
            "name": metadata["name"],
            "description": metadata.get("description", ""),
            "params": params,
            "source": source or "",
            "backtest_count": metadata.get("backtest_count", 0),
        }

    def get_strategy_params(self, name: str) -> list[dict]:
        """
        Extract parameter schema from the StrategyConfig subclass.

        Uses ast.parse for static analysis (no code execution).
        Returns list of dicts with: name, type, default, description.
        Handles: int, float, str, bool, Decimal types.
        """
        file_path = self._find_strategy_file(name)
        if file_path is None:
            return []

        try:
            source = file_path.read_text(encoding="utf-8")
            tree = ast.parse(source)
        except (SyntaxError, OSError):
            return []

        config_class = self._find_config_class(tree)
        if config_class is None:
            return []

        return self._extract_config_fields(config_class)

    def get_strategy_source(self, name: str) -> Optional[str]:
        """Get the raw source code of a strategy file."""
        file_path = self._find_strategy_file(name)
        if file_path is None:
            return None
        try:
            return file_path.read_text(encoding="utf-8")
        except OSError:
            return None

    def load_strategy_class(self, name: str) -> Optional[type]:
        """Dynamically import and return the strategy class."""
        file_path = self._find_strategy_file(name)
        if file_path is None:
            return None

        module_name = self._derive_module_name(file_path)

        try:
            spec = importlib.util.spec_from_file_location(module_name, file_path)
            if spec is None or spec.loader is None:
                return None

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
        except Exception:
            return None

        for attr_name in dir(module):
            obj = getattr(module, attr_name)
            if isinstance(obj, type) and self._is_strategy_class(obj):
                return obj

        return None

    def _has_config_class(self, node: ast.AST) -> bool:
        """Check if a class node has bases that look like StrategyConfig."""
        if not isinstance(node, ast.ClassDef):
            return False
        return self._is_config_class_heuristic(node)

    def save_strategy(self, name: str, source: str) -> dict:
        file_path = self._find_strategy_file(name)
        if file_path is None:
            raise ValueError(f"Strategy '{name}' not found")

        try:
            tree = ast.parse(source)
        except SyntaxError as e:
            raise ValueError(f"Invalid Python syntax: {e}")

        has_strategy = any(
            self._is_strategy_node(node) or self._has_config_class(node)
            for node in ast.walk(tree)
            if isinstance(node, ast.ClassDef)
        )
        if not has_strategy:
            raise ValueError(
                "Source must contain a Strategy subclass with a StrategyConfig"
            )

        file_path.write_text(source)

        metadata = self._parse_strategy_metadata(file_path)

        module_name = file_path.stem
        if module_name in sys.modules:
            del sys.modules[module_name]

        return metadata or {"name": name, "file_path": str(file_path)}

    def _is_strategy_node(self, node: ast.AST) -> bool:
        if not isinstance(node, ast.ClassDef):
            return False
        return self._is_strategy_class_heuristic(node)

    def import_strategy(self, file_path: str) -> dict:
        """
        Copy a .py file into the strategies directory.
        Returns metadata about the imported strategy.
        """
        source = Path(file_path).resolve()
        if not source.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        if source.suffix != ".py":
            raise ValueError(f"Only .py files can be imported, got: {source.suffix}")

        dest = self.strategies_dir / source.name
        shutil.copy2(source, dest)

        metadata = self._parse_strategy_metadata(dest)
        if metadata is None:
            dest.unlink(missing_ok=True)
            raise ValueError(
                "File does not appear to contain a valid nautilus_trader strategy"
            )

        return metadata

    def _discover_strategy_files(self) -> list[Path]:
        """Find all .py files in the strategies directory, excluding __init__.py."""
        if not self.strategies_dir.exists():
            return []
        return sorted(
            p for p in self.strategies_dir.glob("*.py") if p.name != "__init__.py"
        )

    def _find_strategy_file(self, name: str) -> Optional[Path]:
        """Find the .py file for a strategy by name.

        Tries: exact name match (name.py), or scanning files for a matching class.
        """
        exact = self.strategies_dir / f"{name}.py"
        if exact.exists():
            return exact

        for file_path in self._discover_strategy_files():
            metadata = self._parse_strategy_metadata(file_path)
            if metadata and metadata.get("name") == name:
                return file_path

        return None

    def _derive_module_name(self, file_path: Path) -> str:
        try:
            rel = file_path.relative_to(self.strategies_dir.parent)
        except ValueError:
            rel = file_path.relative_to(self.strategies_dir)
        parts = list(rel.parts)
        parts[-1] = Path(parts[-1]).stem
        return "strategies." + "_".join(parts)

    def _is_strategy_class(self, cls: type) -> bool:
        """Check if a class inherits from nautilus_trader Strategy."""
        try:
            from nautilus_trader.trading.strategy import Strategy

            return issubclass(cls, Strategy) and cls is not Strategy
        except ImportError:
            return False

    def _is_config_class_heuristic(self, cls: ast.ClassDef) -> bool:
        """Check if an AST class looks like it inherits from StrategyConfig.

        Works without importing nautilus_trader (pure AST analysis).
        Checks base class names for 'StrategyConfig' or 'Config'.
        """
        for base in cls.bases:
            if isinstance(base, ast.Attribute) and base.attr == "StrategyConfig":
                return True
            if isinstance(base, ast.Name) and "Config" in base.id:
                return True
            # Handle resolve_imports wildcard: MyConfig(StrategyConfig)
            if isinstance(base, ast.Name) and base.id == "StrategyConfig":
                return True
        return False

    def _is_strategy_class_heuristic(self, cls: ast.ClassDef) -> bool:
        """Check if an AST class looks like it inherits from Strategy."""
        for base in cls.bases:
            if isinstance(base, ast.Attribute) and base.attr == "Strategy":
                return True
            if isinstance(base, ast.Name) and base.id == "Strategy":
                return True
        return False

    def _find_config_class(self, tree: ast.AST) -> Optional[ast.ClassDef]:
        """Find the StrategyConfig subclass in the AST."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and self._is_config_class_heuristic(node):
                return node
        return None

    def _find_strategy_class(self, tree: ast.AST) -> Optional[ast.ClassDef]:
        """Find the Strategy subclass in the AST."""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and self._is_strategy_class_heuristic(
                node
            ):
                return node
        return None

    def _ast_type_to_str(self, node: ast.expr) -> Optional[str]:
        """Convert an AST type annotation node to a string type name."""
        if isinstance(node, ast.Name):
            type_map = {
                "str": "str",
                "int": "int",
                "float": "float",
                "bool": "bool",
                # Decimal resolved from import — treat as call
            }
            return type_map.get(node.id)
        if isinstance(node, ast.Constant) and node.value is None:
            return "str"  # Optional types default
        if isinstance(node, ast.Subscript):
            # e.g., Optional[int], list[int] — extract inner name
            inner = node.slice
            if isinstance(inner, ast.Name):
                return self._ast_type_to_str(inner)
            if isinstance(inner, ast.Constant) and inner.value is None:
                return "str"
        return None

    def _ast_default_to_value(self, node: ast.expr) -> tuple[any, str]:
        """Convert an AST default value node to (python_value, type_str).

        Returns (None, "unknown") if not a constant.
        """
        if isinstance(node, ast.Constant):
            val = node.value
            if isinstance(val, bool):
                return (val, "bool")
            if isinstance(val, int):
                return (val, "int")
            if isinstance(val, float):
                return (val, "float")
            if isinstance(val, str):
                return (val, "str")
            if val is None:
                return (None, "str")
            return (val, "unknown")

        # Decimal(5) → ("5", "str") — decimal stored as string
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == "Decimal":
                if node.args:
                    arg = node.args[0]
                    if isinstance(arg, ast.Constant):
                        return (str(arg.value), "str")
                return (None, "str")

        # Unary minus: -1 → (-1, "int")
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            if isinstance(node.operand, ast.Constant):
                return (-node.operand.value, type(node.operand.value).__name__)

        return (None, "unknown")

    def _extract_config_fields(self, config_class: ast.ClassDef) -> list[dict]:
        """Extract field definitions from a StrategyConfig AST class.

        Looks for AnnAssign nodes like: field_name: type = default
        Returns list of {name, type, default, description}.
        """
        params = []

        for node in config_class.body:
            # Standard annotation with default: x: int = 5
            if isinstance(node, ast.AnnAssign) and node.value is not None:
                name = self._get_assign_name(node)
                if name is None:
                    continue

                type_str = self._ast_type_to_str(node.annotation)
                default, inferred_type = self._ast_default_to_value(node.value)

                # Prefer annotation type over inferred type
                resolved_type = type_str or inferred_type
                if resolved_type == "unknown":
                    resolved_type = "str"

                params.append(
                    {
                        "name": name,
                        "type": resolved_type,
                        "default": default,
                        "description": self._extract_doc_for_field(name, config_class),
                    }
                )

            # Assignment without annotation: x = 5 (also valid in some configs)
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        name = target.id
                        val, inferred_type = self._ast_default_to_value(node.value)
                        params.append(
                            {
                                "name": name,
                                "type": inferred_type
                                if inferred_type != "unknown"
                                else "str",
                                "default": val,
                                "description": self._extract_doc_for_field(
                                    name, config_class
                                ),
                            }
                        )

        return params

    def _get_assign_name(self, node: ast.AnnAssign) -> Optional[str]:
        """Extract the field name from an AnnAssign node."""
        if isinstance(node.target, ast.Name):
            return node.target.id
        if isinstance(node.target, ast.Attribute):
            return node.target.attr
        return None

    def _extract_doc_for_field(
        self, field_name: str, config_class: ast.ClassDef
    ) -> str:
        """Try to extract a docstring comment preceding or near a field."""
        # For now, return empty — field-level docstrings are not standard in nautilus configs.
        # Could be extended to parse inline comments.
        return ""

    def _parse_strategy_metadata(self, file_path: Path) -> Optional[dict]:
        """
        AST-based extraction of strategy metadata.

        Parses the file, finds:
        - Classes that inherit from Strategy (base class check via ast)
        - Config subclasses that inherit from StrategyConfig
        - Extracts strategy name from class name
        """
        try:
            source = file_path.read_text(encoding="utf-8")
            tree = ast.parse(source)
        except (SyntaxError, OSError):
            return None

        strategy_cls = self._find_strategy_class(tree)
        if strategy_cls is None:
            # If no Strategy subclass found, still try config-only discovery
            config_cls = self._find_config_class(tree)
            if config_cls is None:
                return None
            # Derive name from file stem or config class
            name = file_path.stem
            description = self._extract_class_docstring(config_cls)
        else:
            name = strategy_cls.name
            description = self._extract_class_docstring(strategy_cls)

        return {
            "name": name,
            "description": description,
            "file_path": str(file_path.relative_to(self.strategies_dir.parent)),
            "backtest_count": 0,
        }

    def _extract_class_docstring(self, cls: ast.ClassDef) -> str:
        """Extract the first line of a class docstring."""
        docstring = ast.get_docstring(cls)
        if docstring:
            return docstring.split("\n")[0].strip()
        return ""
