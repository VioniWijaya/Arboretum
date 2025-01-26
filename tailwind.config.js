/** @type {import('tailwindcss').Config} */
module.exports = {
    daisyui: {
      themes: [
        {
          mytheme: {
  
            primary : "#3E7B27",
  
            button1 : "",
  
            button2 : "",
  
            info: "#16a34a",
  
            success: "#16a34a",
  
            warning: "#facc15",
  
            error: "#ff0000",
  
          },
        },
      ],
    },
    content: ["view/*.{html,js,ejs}", "view/**/*.{html,js,ejs}"],
    theme: {
      extend: {
  
      },
    },
    plugins: [require("daisyui")],
  };