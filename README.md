# Musik and Film Landing Page

This repository contains the optimized landing page for Musik and Film.

## Files Included

*   `index.html`: The fully assembled and optimized HTML landing page.
*   `style.css`: The deferred CSS for all below-the-fold sections.
*   `critical.css`: The render-blocking CSS specifically for the hero section to ensure fast initial paint.
*   `optimized/`: A directory containing 74 highly optimized WebP images, including reduced-size partner logos and downloaded YouTube video thumbnails.
*   `CNAME`: Custom domain configuration for GitHub Pages (`landing.musikandfilm.com`).

## Optimization Notes

*   All original placeholder images have been replaced with real images.
*   Icons and partner logos have been resized and converted to the WebP format.
*   The YouTube videos use a lightweight facade pattern to defer loading the heavy video player until the user interacts with the thumbnail.
*   All images below the fold include `loading="lazy"` and `decoding="async"`.
*   The Hero section is set to `min-height: 100vh` on desktop.
*   The Left column in the services section has a width of 40%.
*   Partner logo cards use a 3:2 rectangular aspect ratio to properly frame the logos.
