export interface LabelProps {
    htmlFor?: string;
    children?: React.ReactNode;
    [key: string]: any;
}

export const Label = ({ htmlFor, children, ...props }: LabelProps) => {
    return (
        <label htmlFor={htmlFor} {...props}>
            {children}
        </label>
    );
};

Label.displayName = 'Label';
