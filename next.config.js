/** @type {import('next').NextConfig} */
const repoBase = '/RepoTyper';

const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: repoBase,
    assetPrefix: `${repoBase}/`,
    trailingSlash: true,
};

module.exports = nextConfig;
