import { motion } from 'framer-motion'

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        className="w-16 h-16 rounded-full border-4 border-primary-100"
        style={{
          borderTopColor: '#22c55e',
          borderRightColor: '#16a34a',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse shadow-md border border-primary-100">
      <div className="h-64 bg-primary-50" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-primary-100 rounded-lg w-3/4" />
        <div className="h-4 bg-primary-50 rounded-lg w-full" />
        <div className="h-4 bg-primary-50 rounded-lg w-2/3" />
        <div className="flex justify-between items-center">
          <div className="h-8 bg-primary-100 rounded-lg w-24" />
          <div className="h-4 bg-primary-50 rounded-lg w-16" />
        </div>
      </div>
    </div>
  )
}