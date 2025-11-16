// assets/colors.js
export const palette = {
    white: '#FFFFFF',
    black: '#000000',

    // Brand (from logo)
    navy: '#2A2D74',         // rgb(42,45,116)
    navyDark: '#1E215E',
    blueMid: '#6F84FF',
    blueSoft: '#E8EEFF',
    gold: '#D4A648',
    red: '#E31D1A',
};

const colors = {
    // existing tokens
    sixty: 'white',                   // 60%
    thirty: 'rgb(42, 45, 116)',       // 30% (navy)
    ten: 'rgb(212, 166, 72)',         // 10% (gold)
    primaryText: 'black',
    secondaryText: 'gray',
    oppText: 'white',
    lightBlue: '#f0f8ff',

    // brand aliases
    brandNavy: palette.navy,
    brandNavyDark: palette.navyDark,
    brandBlueMid: palette.blueMid,
    brandBlueSoft: palette.blueSoft,
    brandGold: palette.gold,
    brandRed: palette.red,

    // Quick links (already used)
    quickLinkGradient: ['#FFFFFF', 'rgba(42,45,116,0.06)'],
    quickLinkBorder: 'rgba(42,45,116,0.12)',

    // Red accent frame for primary clickable cards/buttons
    clickableRedFrame: 'rgba(227, 29, 26, 0.9)',

    // NEW: header/footer/section gradients
    headerGradient: [palette.navyDark, palette.navyDark],
    footerGradient: [palette.navy, palette.navyDark],     // tab bar
    sectionPillGradient: ['#FFFFFF', palette.blueSoft],   // centered section pill

    // Tab icon tints on dark footer
    tabActive: '#FFFFFF',
    tabInactive: 'rgba(255,255,255,0.70)',
};

export default colors;  