import { QRCodeSVG } from 'qrcode.react'

const AddressQrcode: React.FC<{ address: string; size?: number }> = ({
	address,
	size = 220,
}) => {
	return <QRCodeSVG className="max-w-full" value={address} size={size} />
}

export default AddressQrcode
