import React from 'react'
import { ConfigProvider, theme } from 'antd'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootNode = document.getElementById('app')

if (rootNode) {
	createRoot(rootNode).render(
		<ConfigProvider
			theme={{
				algorithm: theme.darkAlgorithm
			}}
		>
			<App />
		</ConfigProvider>
	)
}
