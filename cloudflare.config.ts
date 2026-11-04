import { bindings, defineConfig } from "cf/config";

/**
 * Secret-like files were detected but not read or migrated: .env, .env.example. Only `secrets.required` entries are migrated.
 * @see https://developers.cloudflare.com/workers/configuration/secrets/
 */

export default defineConfig({
	worker: {
		name: "porfolio-wanderleedev",
		compatibilityDate: "2025-01-01",
		entrypoint: "@astrojs/cloudflare/entrypoints/server",
		env: {
			R2_MANIFEST_PUBLIC_URL: bindings.text("https://pub-857ec293a66142f5935891fb2071638c.r2.dev/manifest.json"),
			MANIFEST_BUCKET: bindings.r2({
				name: "portfolio-manifest",
			}),
		},
	},
});
