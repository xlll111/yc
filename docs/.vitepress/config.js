import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'YC文档',
  // 网站描述
  description: 'YC文档',
  base: '/docs/',

  themeConfig: {
    // 设置界面语言
    outlineTitle: '本页目录', // 右侧"On this page"的标题
    lastUpdatedText: '最后更新', // 最后更新时间文本
    // editLinkText: "在GitHub上编辑此页", // 编辑链接文本
    returnToTopLabel: '返回顶部', // 返回顶部按钮
    sidebarMenuLabel: '菜单', // 侧边栏菜单
    darkModeSwitchLabel: '主题', // 深色模式切换
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    skipToContentLabel: '跳转到内容',

    // 网站左上角导航
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/guide/getting-started' },
      // { text: "GitHub", link: "https://github.com" },
    ],
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除搜索条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },
    // 侧边栏
    sidebar: {
      '/guide/': [
        {
          text: '指南',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '配置', link: '/guide/configuration' },
            { text: '控制台', link: '/guide/console' },
          ],
        },
        {
          text: '详细指南',
          // 可以折叠的组
          collapsed: false, // true表示默认折叠
          items: [
            {
              text: '设置',
              link: '/guide/detailed/setting/setting',
              items: [
                {
                  text: '基础设置',
                  collapsed: true,
                  items: [
                    {
                      text: '分辨率适配',
                      link: '/guide/detailed/setting/basic setting/resolution',
                    },
                    {
                      text: '自动关机',
                      link: '/guide/detailed/setting/basic setting/shutdown',
                    },
                    {
                      text: '无头模式',
                      link: '/guide/detailed/setting/basic setting/headless',
                    },
                  ],
                },
                {
                  text: '值日与课表',
                  collapsed: true,
                  items: [
                    {
                      text: '值日更新时间',
                      link: '/guide/detailed/setting/duty and class/update duty',
                    },
                    {
                      text: 'duty偏移量',
                      link: '/guide/detailed/setting/duty and class/duty offset',
                    },
                  ],
                },
                {
                  text: '网络与U盘管理',
                  collapsed: true,
                  items: [
                    {
                      text: '网络与U盘管理',
                      link: '/guide/detailed/setting/network and u disk/network and u disk',
                    },
                  ],
                },
              ],
            },
            {
              text: '快捷键',
              link: '/guide/detailed/shortcut',
            },
            {
              text: '控制台',
              link: '/guide/detailed/console/console',
              items: [{ text: '联网控制', link: '/guide/nan' }],
            },
          ],
        },
      ],
    },

    // 社交链接
    // socialLinks: [{ icon: "github", link: "https://github.com" }],
  },
})
