import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select className={className} ref={ref} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = 'Select';

export const SelectOption = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, ...props }, ref) => <option ref={ref} className={className} {...props} />,
);
SelectOption.displayName = 'SelectOption';
