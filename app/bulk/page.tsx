'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function BulkOrderPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    category: '',
    products: '',
    quantity: '',
    targetDate: '',
    country: '',
    notes: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitted Data:', formData)
    alert('Form submitted successfully!')
  }

  const categories = [
    'Cutlery',
    'Shoes',
    'Clothes',
    'Home Appliances',
    'Mixed / Other',
  ]

  const countries = [
    'Pakistan',
    'UAE',
    'Saudi Arabia',
    'United States',
    'United Kingdom',
    'Other',
  ]

  return (
    <section className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ================= HEADING + PARAGRAPH ================= */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#FFCE00]">
            📦 Signature Trader: Bulk & Corporate Orders
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Elevate your business or next large event with the Signature Trader
            wholesale collection. We offer competitive pricing and dedicated
            support for high-volume orders across our entire catalog — from
            elegant cutlery sets for your restaurant, uniforms and footwear for
            your staff, to bulk home appliances and fans for property
            development or retail distribution. Fill out the form below, and a
            dedicated Bulk Order Specialist will contact you within 48 hours to
            provide a custom quote and timeline.
          </p>
        </div>

        {/* ================= FORM ================= */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-8 rounded-2xl shadow-sm border border-border"
        >
          {/* Full Name */}
          <div>
            <label className="block mb-2 text-sm font-medium">Full Name *</label>
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="bg-background border-border"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Company / Business Name
            </label>
            <Input
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Signature Cafe or Noor Traders"
              className="bg-background border-border"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Email Address *
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="bg-background border-border"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Phone Number
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+92 300 1234567"
              className="bg-background border-border"
            />
          </div>

          {/* Product Category */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Product Category *
            </label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black dark:bg-[#1a1a1a] dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg">
                {categories.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="hover:bg-[#FFCE00]/20 dark:hover:bg-[#FFCE00]/30 cursor-pointer"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Required Quantity *
            </label>
            <Input
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Minimum 50 units"
              required
              className="bg-background border-border"
            />
          </div>

          {/* Desired Product(s) */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium">
              Desired Product(s)
            </label>
            <Textarea
              name="products"
              value={formData.products}
              onChange={handleChange}
              placeholder='e.g. "Classic 24-piece cutlery", "Model 500 Desk Fan", "Men’s White Sneaker"'
              className="bg-background border-border"
              rows={4}
            />
          </div>

          {/* Target Date */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Target Date Needed By
            </label>
            <Input
              name="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={handleChange}
              className="bg-background border-border"
            />
          </div>

          {/* Shipping Country */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Shipping Country / Region *
            </label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, country: value }))
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black dark:bg-[#1a1a1a] dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg">
                {countries.map((country) => (
                  <SelectItem
                    key={country}
                    value={country}
                    className="hover:bg-[#FFCE00]/20 dark:hover:bg-[#FFCE00]/30 cursor-pointer"
                  >
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium">
              Additional Details / Notes
            </label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Custom branding, recurring order needs, or budget constraints..."
              className="bg-background border-border"
              rows={5}
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-center">
            <Button
              type="submit"
              className="bg-[#FFCE00] hover:bg-[#e6b800] text-black font-semibold px-8 py-3 text-lg rounded-lg"
            >
              Request Custom Quote
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
