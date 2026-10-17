# Sources and credits

This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## Local hero photograph — 16/10/2026

Created with the built-in imagegen tool using the owner's bouquet photograph as a visual reference, with the owner's permission. This is decorative campaign imagery, separate from DB-owned product photographs. No generated UI/text is baked into the image.

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

Administrative names/codes derive from **Open Admin Data**, [Vietnam Administrative Divisions](https://github.com/open-admin-data/vietnam-administrative-divisions), under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The project extracts the supported area and normalizes the province display name; the source snapshot and transformations are recorded in [DELIVERY_ADDRESS.md](docs/DELIVERY_ADDRESS.md#nguồn-và-giấy-phép).
