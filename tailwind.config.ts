import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 银灰金属底（科技 × 简约）
        silver: {
          50: '#FBFBFC',
          100: '#F5F6F8',
          200: '#EEF0F4',
          300: '#E1E5EC',
          400: '#D7DBE2',
          500: '#A4ADB9',
          600: '#6C7789',
        },
        // 暖珊瑚橘（主 CTA / 当前步高亮 / 加油态）
        coral: {
          50: '#FDF0EC',
          100: '#FBE0D8',
          500: '#E8725C',
          600: '#D45D47',
          700: '#B84B37',
        },
        // 柔粉 / 杏粉（证据墙 / 广场求助帖底色）
        softpink: {
          100: '#FDF1F4',
          200: '#F9E4E0',
          300: '#F3B8C8',
        },
        // 深石板蓝灰（标题 / 正文）
        slateblue: {
          700: '#5B6472',
          800: '#2A3446',
          900: '#3E4C63',
        },
        warmgreen: '#7FB685',
        warmred: '#D97A6C',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(62, 76, 99, 0.04), 0 8px 24px -12px rgba(62, 76, 99, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
