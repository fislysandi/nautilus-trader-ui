declare namespace JSX {
  interface IntrinsicElements {
    'md-top-app-bar': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { headline?: string },
      HTMLElement
    >;
    'md-navigation-drawer': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & { open?: boolean },
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
  }
}
