import { useEffect, useRef } from 'react'

import defaultImgSrc from './default_img.png'

interface ILazyLoadImageProps {
	alt?: string
	height: number
	width: number
	src: string
}

const LazyLoadImage = (props: ILazyLoadImageProps) => {
	const { src, ...rest } = props
	const imgRef = useRef(null)

	function onContentLoaded() {
		// 创建交叉观察者实例
		const observer = new IntersectionObserver((entries, observer) => {
			entries.forEach((entry) => {
				// 当图片进入视口时
				if (entry.isIntersecting) {
					const img = entry.target

					img.setAttribute('src', src) // 设置图片的 src 属性

					observer.unobserve(img) // 停止观察当前图片
				}
			})
		})

		if (imgRef.current) {
			observer.observe(imgRef.current)
		}
	}

	useEffect(() => {
		onContentLoaded()
	}, [])

	// src先设置成defaultImgSrc，等进入视口的时候会被替换的
	return <img ref={imgRef} src={defaultImgSrc} {...rest} />
}

export default LazyLoadImage
