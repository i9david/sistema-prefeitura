import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sistema - Secretaria de Cultura e Turismo',
  description: 'Sistema de gestão integrada',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = localStorage.getItem('ui-theme');
                  var collapsed = localStorage.getItem('module-sidebar-collapsed') === '1';
                  if (!theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.toggle('module-sidebar-collapsed', collapsed);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="app-shell">{children}</body>
    </html>
  )
}
