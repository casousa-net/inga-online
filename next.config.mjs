/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config) => {
    // Configuração para permitir importação de imagens no React PDF
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|ico|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'static/images/',
            publicPath: '/_next/static/images/',
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;