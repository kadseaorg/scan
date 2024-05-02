import React, { useEffect, useState } from 'react'
import AceEditor from 'react-ace'

const AceEditorWithRef = ({ onMount, ...props }) => {
	const [modeAndThemeLoaded, setModeAndThemeLoaded] = useState(false)

	const handleEditorLoad = (editor) => {
		if (onMount) {
			onMount(editor)
		}
	}

	useEffect(() => {
		if (typeof window !== 'undefined') {
			Promise.all([
				import('ace-builds/src-noconflict/mode-typescript'),
				import('ace-builds/src-noconflict/theme-xcode'),
			]).then(() => {
				setModeAndThemeLoaded(true)
			})
		}
	}, [])

	if (!modeAndThemeLoaded) {
		return null // 或者返回一个加载指示器
	}

	return <AceEditor {...props} onLoad={handleEditorLoad} />
}

export default AceEditorWithRef
