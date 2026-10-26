/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
    colors: {
        primary: {
            '50': 'hsl(28, 98%, 97%)',
            '100': 'hsl(28, 98%, 94%)',
            '200': 'hsl(28, 98%, 86%)',
            '300': 'hsl(28, 98%, 76%)',
            '400': 'hsl(28, 98%, 64%)',
            '500': 'hsl(28, 98%, 50%)',
            '600': 'hsl(28, 98%, 40%)',
            '700': 'hsl(28, 98%, 32%)',
            '800': 'hsl(28, 98%, 24%)',
            '900': 'hsl(28, 98%, 16%)',
            '950': 'hsl(28, 98%, 10%)',
            DEFAULT: '#d96502'
        },
        secondary: {
            '50': 'hsl(217, 100%, 97%)',
            '100': 'hsl(217, 100%, 94%)',
            '200': 'hsl(217, 100%, 86%)',
            '300': 'hsl(217, 100%, 76%)',
            '400': 'hsl(217, 100%, 64%)',
            '500': 'hsl(217, 100%, 50%)',
            '600': 'hsl(217, 100%, 40%)',
            '700': 'hsl(217, 100%, 32%)',
            '800': 'hsl(217, 100%, 24%)',
            '900': 'hsl(217, 100%, 16%)',
            '950': 'hsl(217, 100%, 10%)',
            DEFAULT: '#116dff'
        },
        accent: {
            '50': 'hsl(21, 99%, 97%)',
            '100': 'hsl(21, 99%, 94%)',
            '200': 'hsl(21, 99%, 86%)',
            '300': 'hsl(21, 99%, 76%)',
            '400': 'hsl(21, 99%, 64%)',
            '500': 'hsl(21, 99%, 50%)',
            '600': 'hsl(21, 99%, 40%)',
            '700': 'hsl(21, 99%, 32%)',
            '800': 'hsl(21, 99%, 24%)',
            '900': 'hsl(21, 99%, 16%)',
            '950': 'hsl(21, 99%, 10%)',
            DEFAULT: '#b74101'
        },
        'neutral-50': '#000000',
        'neutral-100': '#ffffff',
        'neutral-200': '#141414',
        'neutral-300': '#969da5',
        'neutral-400': '#d6d6d6',
        background: '#ffffff',
        foreground: '#000000'
    },
    fontFamily: {
        body: [
            'wfont_ced490_9eb54a17069041c7b3a2095964951377',
            'sans-serif'
        ],
        font1: [
            'wfont_f941ec_7b8b892c305e412dbd37a4fcbf1ee3f4',
            'sans-serif'
        ],
        font2: [
            'Arial',
            'sans-serif'
        ],
        font3: [
            'wfont_66a541_b524e145baef478c9a1712a046b1333b',
            'sans-serif'
        ],
        font4: [
            'Helvetica',
            'sans-serif'
        ]
    },
    fontSize: {
        '10': [
            '10px',
            {
                lineHeight: 'normal'
            }
        ],
        '14': [
            '14px',
            {
                lineHeight: 'normal'
            }
        ],
        '16': [
            '16px',
            {
                lineHeight: 'normal'
            }
        ],
        '18': [
            '18px',
            {
                lineHeight: '32.4px'
            }
        ],
        '20': [
            '20px',
            {
                lineHeight: '20px'
            }
        ],
        '26': [
            '26px',
            {
                lineHeight: '36.4px'
            }
        ],
        '28': [
            '28px',
            {
                lineHeight: '32px'
            }
        ],
        '64': [
            '64px',
            {
                lineHeight: '89.6px'
            }
        ],
        '14.994': [
            '14.994px',
            {
                lineHeight: '18.7425px'
            }
        ],
        '13.3333': [
            '13.3333px',
            {
                lineHeight: 'normal'
            }
        ],
        '10.5': [
            '10.5px',
            {
                lineHeight: '13.125px'
            }
        ]
    },
    spacing: {
        '0': '1px',
        '1': '8px',
        '2': '16px',
        '3': '24px',
        '4': '29px',
        '5': '37px',
        '6': '40px',
        '7': '43px',
        '8': '52px',
        '9': '59px',
        '10': '68px',
        '11': '81px',
        '12': '85px',
        '13': '120px',
        '14': '149px',
        '15': '190px',
        '16': '194px',
        '17': '197px',
        '18': '257px'
    },
    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px'
    },
    boxShadow: {
        xs: 'rgba(0, 0, 0, 0.25) -1.36px 2.67px 21px 1px',
        sm: 'rgba(0, 0, 0, 0.3) 0px 32px 68px 0px'
    },
    transitionDuration: {
        '80': '0.08s',
        '300': '0.3s',
        '400': '0.4s'
    },
    transitionTimingFunction: {
        custom: 'cubic-bezier(0, 0, 1, 1)'
    },
    container: {
        center: true,
        padding: '0px'
    },
    maxWidth: {
        container: '100%'
    }
},
  },
};
