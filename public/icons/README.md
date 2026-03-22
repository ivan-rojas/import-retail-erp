# PWA icons

Place your app icons in this folder so the app can be installed on phones and tablets.

## Required files (manifest references these paths)

| Size      | File name           | Use case                          |
|-----------|---------------------|-----------------------------------|
| **72×72** | `icon-72x72.png`    | Legacy Android                    |
| **96×96** | `icon-96x96.png`    | Legacy Android                    |
| **128×128** | `icon-128x128.png` | Legacy / small tiles              |
| **144×144** | `icon-144x144.png` | Windows tiles                     |
| **152×152** | `icon-152x152.png` | iPad home screen                  |
| **192×192** | `icon-192x192.png` | **Android Chrome (required)**     |
| **384×384** | `icon-384x384.png` | Android splash                    |
| **512×512** | `icon-512x512.png` | **Android splash / high-res (required)** |

## Minimum to get “Add to Home Screen” working

- **192×192** (`icon-192x192.png`) – Android
- **512×512** (`icon-512x512.png`) – Android and high-res

You can start with only these two; the rest improve appearance on different devices.

## iOS (Apple)

For “Add to Home Screen” on iPhone/iPad, also add:

- **180×180** – save as `apple-touch-icon.png` in `public/` (root of public folder)

The layout already points to the manifest; iOS will use the 192×192 or 512×512 from the manifest if no `apple-touch-icon.png` is present.

## Image guidelines

- **Format:** PNG, transparent or solid background.
- **Content:** Prefer a simple logo or “app” mark; avoid small text.
- **Maskable (192 and 512):** For “maskable” icons, keep important content inside the central ~80% so round/cut-off shapes don’t crop the logo.

### Fixing the black border on iOS

If the icon on iPhone shows a **black (or visible) border** around your logo, the image has inner padding: the colored area doesn't reach the edges of the file. iOS crops the image to a rounded square, so that outer area becomes the visible border.

**Fix: full-bleed design**

- The **background color** behind your logo (e.g. the dark rectangle) must go **all the way to the edges** of the image.
- Use a canvas the exact size of the icon (e.g. 180×180 for `apple-touch-icon.png`).
- Draw the background so it fills the whole canvas; place the "TL" logo centered on top. No transparent or different-colored margin around the edges.
- Export with no extra padding. The file should look like a solid block of that dark color with the logo in the middle.

Re-export `apple-touch-icon.png` (and regenerate other sizes from it) so every icon file is full-bleed, then re-add to home screen to see the fix.

## Generating from one image

From a single high-res image (e.g. 512×512), you can generate the rest with:

- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Or ImageMagick / sharp in a script to resize to each size above.
