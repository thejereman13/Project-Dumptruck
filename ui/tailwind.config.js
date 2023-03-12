module.exports = {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}"],
    darkMode: "class",
    theme: {
        extend: {},
    },
    plugins: [require("daisyui")],
    daisyui: {
        // themes: ["dark"]
        themes: [
            {
                mytheme: {
                    primary: "#42a5f5",

                    secondary: "#7e57c2",

                    accent: "#059669",

                    neutral: "#353535",

                    "base-100": "#222222",

                    info: "#42a5f5",

                    success: "#16a34a",

                    warning: "#ca8a04",

                    error: "#dc2626",
                },
            },
        ],
    },
};
