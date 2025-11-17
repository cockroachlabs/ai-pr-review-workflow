import type { ThemeConfig } from "antd";
import {
  ColorBackgroundBase,
  ColorBaseDanger,
  ColorBaseSuccess,
  ColorBaseWarning,
  ColorCoreRed4,
  ColorFont2,
  ColorFont3,
  ColorFont4,
  TypeFamilyCode,
  TypeFamilyUi,
  // CRL Design System Brand Colors
  BrandActionBlue,
  BrandElectricPurple,
  BrandLightBlue,
  // CRL Core Neutrals
  ColorCoreNeutral1,
  ColorCoreNeutral2,
  ColorCoreNeutral3,
  ColorCoreNeutral6,
} from "./tokens";

/** Setting the AntD theme allows us to customize styling so that AntD
 * components match CRL style guidelines.
 *
 * For global overrides that cannot be configured with tokens, please
 * put styles in `assets/css/global/_overrides.scss`.
 *
 * @see https://ant.design/docs/react/customize-theme */
export const crlTheme: ThemeConfig = {
  token: {
    borderRadius: 2,
    colorBgLayout: ColorBackgroundBase,
    colorBgSpotlight: ColorCoreNeutral6,
    colorBorder: ColorCoreNeutral3,
    colorBorderSecondary: ColorCoreNeutral2,
    colorFill: ColorCoreNeutral3,
    colorFillSecondary: ColorCoreNeutral2,
    colorFillTertiary: ColorCoreNeutral1,
    colorFillQuaternary: ColorCoreNeutral1,
    colorError: ColorBaseDanger,
    colorInfo: BrandActionBlue,
    colorPrimary: BrandElectricPurple,
    colorSuccess: ColorBaseSuccess,
    colorWarning: ColorBaseWarning,
    colorText: ColorFont2,
    colorTextSecondary: ColorFont3,
    colorTextTertiary: ColorFont4,
    colorTextQuaternary: ColorFont4,
    // The trailing CC is 80% opacity.
    // https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4
    colorBgMask: `${ColorCoreNeutral6}CC`,
    fontFamily: TypeFamilyUi,
    fontFamilyCode: TypeFamilyCode,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 16,
    lineHeight: 1.7,
    lineHeightHeading1: 1.7,
    lineHeightHeading2: 2,
    lineHeightHeading3: 1.6,
    lineHeightHeading4: 1.5,
    lineHeightHeading5: 1.5,
    controlHeight: 40, // Should match $crl-input-height.
  },
  components: {
    Modal: {
      padding: 0,
      paddingContentHorizontal: 0,
      paddingContentHorizontalSM: 0,
      paddingContentHorizontalLG: 0,
      paddingContentVertical: 0,
      paddingContentVerticalSM: 0,
      paddingContentVerticalLG: 0,
      paddingLG: 0,
      paddingMD: 0,
      paddingSM: 0,
      paddingXL: 0,
      paddingXS: 0,
      paddingXXS: 0,
    },
    Dropdown: {
      controlItemBgHover: BrandLightBlue,
      controlItemBgActive: BrandLightBlue,
      controlItemBgActiveHover: BrandLightBlue,
      colorError: ColorCoreRed4,
    },
    Table: {
      colorFillAlter: "transparent",
      colorFillSecondary: "transparent",
      colorFillContent: "transparent",
    },
    Select: {
      borderRadius: 3,
      controlOutline: `${BrandElectricPurple}66`,
      controlItemBgHover: "transparent",
      optionActiveBg: BrandLightBlue,
    },
    Tabs: {
      lineHeight: 1.5,
      colorPrimaryActive: BrandElectricPurple,
      colorPrimaryText: BrandElectricPurple,
      colorPrimaryTextHover: BrandElectricPurple,
      colorPrimaryHover: BrandElectricPurple,
      fontSize: 16,
      colorBorderSecondary: ColorCoreNeutral3,
    },
    Pagination: {
      controlHeightSM: 24,
      colorBgTextHover: "transparent",
      colorBgTextActive: "transparent",
    },
    Tooltip: {
      controlHeight: 32,
    },
    Slider: {
      trackBg: BrandElectricPurple,
      trackHoverBg: BrandElectricPurple,
      handleColor: BrandElectricPurple,
      handleActiveColor: BrandElectricPurple,
      railBg: ColorCoreNeutral3,
      railHoverBg: ColorCoreNeutral3,
      dotActiveBorderColor: BrandElectricPurple,
      dotBorderColor: ColorCoreNeutral3,
    },
    Segmented: {
      itemSelectedBg: BrandElectricPurple,
      itemSelectedColor: "#ffffff",
      trackBg: "#f0f0f0",
    },
  },
};

export const antdPrefixCls = "crl-ant";
