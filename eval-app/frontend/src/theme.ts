import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      // Primary colors
      deepPurple: '#190f33',
      darkBlue: '#0037A5',
      electricPurple: '#6933ff',
      iridescentBlue: '#00fced',
      // Secondary colors
      actionBlue: '#0055ff',
      lightBlue: '#c2d5ff',
      actionPurple: '#b921f1',
      lightPurple: '#f7d6ff',
      // Chakra scale for components
      50: '#f7d6ff',
      100: '#c2d5ff',
      200: '#b88aff',
      300: '#9c5bff',
      400: '#6933ff',
      500: '#6933ff', // Electric purple as primary
      600: '#0037A5', // Dark blue
      700: '#190f33', // Deep purple
      800: '#190f33',
      900: '#190f33',
    },
    // Neutrals
    neutral: {
      50: '#FFFFFF',
      100: '#F5F7FA',
      200: '#E7ECF3',
      300: '#D6DBE7',
      400: '#C0C6D9',
      500: '#7E89A9',
      600: '#475872',
      700: '#394455',
      800: '#242A35',
      900: '#060C12',
    },
    sentiment: {
      positive: '#38a169',
      negative: '#e53e3e',
      neutral: '#ed8936',
    },
  },
  fonts: {
    heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`,
    mono: `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace`,
  },
  styles: {
    global: {
      body: {
        bg: 'neutral.100',
        color: 'neutral.800',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'sm',
          transition: 'all 0.2s',
          _hover: {
            boxShadow: 'md',
          },
        },
      },
    },
  },
})

export default theme
