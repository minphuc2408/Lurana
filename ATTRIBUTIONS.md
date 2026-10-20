# Sources and credits

This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## Home reference photographs — 18/10/2026

The owner requested the imagery from the read-only design reference `D:/Download/lunara`. Home now imports local JPEG copies of those Unsplash photos; product images remain catalog-owned. Requests preserve the reference's `auto=format&fit=crop&q=85`, with width variants for the Hero. No generated replacement or color treatment is applied.

The local reference path records provenance only. The committed assets and source URLs below are sufficient for maintenance; the reference directory is not required on another machine.

| Local asset in `src/assets/home-reference/` | Reference source | Dimensions |
| --- | --- | --- |
| `hero-640.jpg`, `hero-960.jpg`, `hero-1400.jpg` | [Bouquet held in two hands](https://images.unsplash.com/photo-1526047932273-341f2a7631f9) | 640² / 960² / 1400² |
| `story-florist-1000.jpg` | [Flowers outside a shop](https://images.unsplash.com/photo-1589244159943-460088ed5c92) | 1000 × 652 |
| `story-card-600.jpg` | [Paper detail](https://images.unsplash.com/photo-1586075010923-2dd4570fb338) | 600 × 900 |
| `story-wrapping-600.jpg` | [Gift detail](https://images.unsplash.com/photo-1513519245088-0e12902e5a38) | 600 × 400 |

The header flower illustration and Journey line art are adapted from the same reference. The wordmark remains Lunarra. Footer artwork/layout is unchanged.

## Previous local hero photograph — 16/10/2026

Created with the built-in imagegen tool using the owner's bouquet photograph as a visual reference, with the owner's permission. Retained assets, superseded on Home by the reference photography above. This is decorative campaign imagery, separate from DB-owned product photographs. No generated UI/text is baked into the image.

Reviewed assets:

- [lunara-bouquet-640.webp](src/assets/hero/lunara-bouquet-640.webp) — 640 × 480, 47,130 bytes.
- [lunara-bouquet-960.webp](src/assets/hero/lunara-bouquet-960.webp) — 960 × 720, 83,250 bytes.
- [lunara-bouquet-1440.webp](src/assets/hero/lunara-bouquet-1440.webp) — 1440 × 1080, 149,910 bytes.

WebP derivatives use cwebp quality 82/82/84, method 6, metadata none; the full-resolution generated PNG stays local/ignored. Vite imports emit hashed URLs.

## Category illustrations — 16/10/2026

Four owner-requested category illustrations created with the built-in imagegen tool. These identify collections; they are not photos of exact products for sale. WebP derivatives are 256 × 256, cwebp quality 84/method 6/metadata none, each 10–14 KB. D1 stores the revisioned same-origin URL only. Full-resolution PNG outputs remain local/ignored.

| Asset | Subject |
| --- | --- |
| [bouquets-v1.webp](public/images/categories/bouquets-v1.webp) | Hand-tied blush/ivory bouquet in pink paper with a rose ribbon |
| [arrangements-v1.webp](public/images/categories/arrangements-v1.webp) | Wicker flower basket with cream/pink/lilac flowers |
| [dried-flowers-v1.webp](public/images/categories/dried-flowers-v1.webp) | Dried bouquet with pampas, bunny tails, lavender and wheat |
| [gift-sets-v1.webp](public/images/categories/gift-sets-v1.webp) | Blush keepsake flower box with an unbranded candle |

## Administrative data

Administrative names/codes derive from **Open Admin Data**, [Vietnam Administrative Divisions](https://github.com/open-admin-data/vietnam-administrative-divisions), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The project extracts the supported area and normalizes the province display name; the source snapshot and transformations are recorded in [DELIVERY_ADDRESS.md](docs/features/DELIVERY_ADDRESS.md#nguồn-và-giấy-phép).

## Fonts

The Vietnamese typefaces are [Lora](https://github.com/google/fonts/tree/main/ofl/lora) and [Be Vietnam Pro](https://github.com/google/fonts/tree/main/ofl/bevietnampro), recorded in the project guide under the SIL Open Font License. These source/license references move here with the documentation refactor; runtime selection and weights belong to [DESIGN_SYSTEM.md](docs/ui-ux/DESIGN_SYSTEM.md#typography-theo-locale). Fonts are loaded through the Google Fonts stylesheet in `index.html`.
