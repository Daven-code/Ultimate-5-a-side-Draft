/******************************************************************************
 * Layout.ts
 *
 * PURPOSE
 * -------
 * Responsive layout helper.
 *
 * Instead of hardcoding positions,
 * every scene asks this file where things belong.
 *
 * This allows us to support:
 *
 * 1920x1080
 * 1080x1920
 * 1440x1440
 *
 * without rewriting scenes.
 ******************************************************************************/

export interface Layout {

    logoWidth:number;

    titleTop:number;

    screenshotWidth:number;

    ctaBottom:number;

}

export const landscape:Layout={

    logoWidth:430,

    titleTop:760,

    screenshotWidth:1450,

    ctaBottom:120,

};

export const portrait:Layout={

    logoWidth:320,

    titleTop:1350,

    screenshotWidth:920,

    ctaBottom:180,

};