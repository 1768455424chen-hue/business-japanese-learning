import { useState } from 'react'
import UsageGuideModal from './UsageGuideModal'

const STORAGE_KEY = 'business-japanese-skill-usage-notice-seen'

export default function UsageGuideGuard() {
  const [showModal, setShowModal] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShowModal(false)
  }

  return (
    <UsageGuideModal
      open={showModal}
      onClose={handleClose}
      showCloseButton={false}
    />
  )
}
