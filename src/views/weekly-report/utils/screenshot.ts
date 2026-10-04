// utils/screenshot.ts
/** 
 * 截图模式开关：URL 带 ?screenshot=1 时为 true
 * 用于服务端 Puppeteer 截图时关闭动画，避免截到"入场动画第 0 帧"
 */
export const IS_SCREENSHOT_MODE =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('screenshot') === '1';

/**
 * 把 option 包装成"截图友好"的版本：
 * 关闭所有动画相关配置
 */
export function noAnim<T extends Record<string, any>>(option: T): T {
    if (!IS_SCREENSHOT_MODE) return option;
    return {
        ...option,
        animation: false,
        animationDuration: 0,
        animationDurationUpdate: 0,
        animationEasing: 'linear',
        animationEasingUpdate: 'linear',
        // 有些图表系列的动画在这个字段
        ...(option.series
            ? {
                series: (Array.isArray(option.series) ? option.series : [option.series]).map(
                    (s: any) => ({
                        ...s,
                        animation: false,
                        animationDuration: 0,
                        animationDurationUpdate: 0,
                    }),
                ),
            }
            : {}),
    };
}