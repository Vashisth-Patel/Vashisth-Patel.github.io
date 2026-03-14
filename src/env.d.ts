interface ImportMetaEnv {
    readonly PUBLIC_N8N_WEBHOOK_URL: string;
    readonly SITE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
