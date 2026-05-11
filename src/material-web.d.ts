declare namespace JSX {
  interface IntrinsicElements {
    'md-navigation-drawer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { opened?: boolean },
      HTMLElement
    >;
    'md-list-item': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    'md-icon': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    'md-icon-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
  }
}
