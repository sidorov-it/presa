import type { Config } from "tailwindcss";

export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            typography: {
                DEFAULT: {
                    css: {
                        'strong': {
                            color: 'inherit',
                            fontWeight: '700',
                        },
                    },
                },
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography')({
            skip: ['.tiptap :where(strong):not(:where([class~="not-prose"],[class~="not-prose"] *))']
        }),
    ],
} satisfies Config;
