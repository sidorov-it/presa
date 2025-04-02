interface HeadingProps {
    title: string
    description?: string
}

export function Heading({ title, description }: HeadingProps) {
    return (
        <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            {description && (
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </div>
    )
}