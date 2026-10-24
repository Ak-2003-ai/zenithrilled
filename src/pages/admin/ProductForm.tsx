import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addCategory, deleteCategory, getCategories, pickProductImage, productForEdit, saveProduct } from '../../lib/data'
import { Spinner, Toast } from '../../components/ui'

type FormState = {
  name: string
  category: string
  description: string
  price: string
  image_url: string
  is_active: boolean
  show_stock: boolean
  stock_qty: number
}

const BLANK: FormState = {
  name: '',
  category: '',
  description: '',
  price: '',
  image_url: '',
  is_active: true,
  show_stock: false,
  stock_qty: 0,
}

export default function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [form, setForm] = useState<FormState>(BLANK)
  const [categories, setCategories] = useState<string[]>([])
  const [addingCat, setAddingCat] = useState(false)
  const [newCatInput, setNewCatInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; tone?: 'error' } | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const p = await productForEdit(id)
        setForm({
          name: p?.name ?? '',
          category: p?.category ?? '',
          description: p?.description ?? '',
          price: p ? String(p.price) : '',
          image_url: p?.image_url ?? '',
          is_active: p?.is_active ?? true,
          show_stock: p?.show_stock ?? false,
          stock_qty: p?.stock_qty ?? 0,
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const flash = (msg: string, tone?: 'error') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 3200)
  }

  const handleAddCategory = async () => {
    const trimmed = newCatInput.trim()
    if (!trimmed) return
    const updated = await addCategory(trimmed)
    setCategories(updated)
    setForm((prev) => ({ ...prev, category: trimmed }))
    setNewCatInput('')
    setAddingCat(false)
    flash(`Category "${trimmed}" added!`)
  }

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Delete category "${catName}"?`)) return
    const updated = await deleteCategory(catName)
    setCategories(updated)
    if (form.category.toLowerCase() === catName.toLowerCase()) {
      setForm((prev) => ({ ...prev, category: '' }))
    }
    flash(`Category "${catName}" removed.`)
  }

  const onPickFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      flash('That photo is over 8 MB — pick something smaller.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(file)
    setUploading(true)
    try {
      const url = await pickProductImage(file)
      setForm((f) => ({ ...f, image_url: url }))
      if (url.startsWith('data:')) {
        flash('Photo loaded inline. To host photos in Supabase, run the storage SQL setup in README.')
      } else {
        flash('Photo uploaded successfully.')
      }
    } catch (err) {
      flash(
        `Upload failed (${(err as Error).message}).`,
        'error',
      )
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    const price = Number(form.price)
    if (!form.name.trim()) {
      flash('Give the product a name.', 'error')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      flash('Enter a valid price in ₹ (0 or more).', 'error')
      return
    }
    setBusy(true)
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price,
      image_url: form.image_url.trim(),
      is_active: form.is_active,
      show_stock: form.show_stock,
      stock_qty: form.show_stock ? Math.max(0, Math.round(form.stock_qty || 0)) : 0,
    }
    try {
      await saveProduct(payload, id)
      flash(isEdit ? 'Changes saved' : `${payload.name} is on the shelf`)
      navigate('/admin')
    } catch (err) {
      flash(`Could not save: ${(err as Error).message}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading product" />

  return (
    <>
      <div className="head-row">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit product' : 'Add a product'}</h1>
          <p className="page-sub">
            {isEdit
              ? 'Update the details, swap the photo, or change how stock is shown.'
              : 'Fill this in and it goes live in the shop the moment you save.'}
          </p>
        </div>
      </div>

      <div className="panel section-gap" style={{ padding: 24, maxWidth: 620 }}>
        <div className="field">
          <label htmlFor="f-name">Name</label>
          <input
            id="f-name"
            className="input"
            value={form.name}
            placeholder="Amigurumi Bear"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="f-category">Category</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              id="f-category"
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{ flex: 1, minWidth: 180 }}
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setAddingCat((v) => !v)}
              title="Add or manage categories"
            >
              {addingCat ? 'Close' : '+ Add / Manage'}
            </button>
            {form.category && (
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteCategory(form.category)}
                title={`Delete category "${form.category}"`}
              >
                Delete
              </button>
            )}
          </div>

          {addingCat && (
            <div style={{ marginTop: 12, padding: 12, background: 'var(--paper-deep)', borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input"
                  type="text"
                  placeholder="New category name (e.g. Blankets, Keychains)"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleAddCategory}
                  disabled={!newCatInput.trim()}
                >
                  Add
                </button>
              </div>

              {categories.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="muted small" style={{ marginBottom: 6, fontWeight: 600 }}>
                    Existing categories (click × to delete):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {categories.map((c) => (
                      <span
                        key={c}
                        className="badge"
                        style={{
                          background: 'var(--card)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 8px 3px 10px',
                        }}
                      >
                        <span>{c}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--brick)',
                            fontSize: '15px',
                            lineHeight: 1,
                            padding: '0 2px',
                            fontWeight: 700,
                          }}
                          title={`Delete category "${c}"`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="f-price">Price (₹)</label>
          <input
            id="f-price"
            className="input"
            type="number"
            min="0"
            step="1"
            value={form.price}
            placeholder="499"
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            style={{ maxWidth: 180 }}
          />
        </div>

        <div className="field">
          <label htmlFor="f-desc">Description</label>
          <textarea
            id="f-desc"
            className="textarea"
            value={form.description}
            placeholder="What it is, the yarn, the size, how it's made…"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="field">
          <label htmlFor="f-img">Photo</label>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            {preview && (
              <img
                src={preview}
                alt="Preview of the selected photo"
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'contain',
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  padding: 4,
                  boxSizing: 'border-box',
                }}
              />
            )}
            <label className="btn" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading…' : 'Choose a photo'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </label>
            {(preview || form.image_url) && (
              <button
                className="btn btn-sm"
                onClick={() => {
                  setPreview(null)
                  setForm((f) => ({ ...f, image_url: '' }))
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="field" style={{ paddingBottom: 6 }}>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="switch-text">
              Show in store (Active)
            </span>
          </label>
          <div className="muted small" style={{ marginTop: 4 }}>
            When turned off, this product will appear translucent and marked as out of stock in the shop.
          </div>
        </div>

        <div className="field" style={{ paddingBottom: 6 }}>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.show_stock}
              onChange={(e) => setForm({ ...form, show_stock: e.target.checked })}
            />
            <span className="switch-text">
              Show stock to customers
            </span>
          </label>
        </div>

        {form.show_stock && (
          <div className="field">
            <label htmlFor="f-qty">How many are ready right now?</label>
            <input
              id="f-qty"
              className="input"
              type="number"
              min="0"
              step="1"
              value={form.stock_qty}
              onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })}
              style={{ maxWidth: 140 }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="btn btn-primary"
            onClick={save}
            disabled={busy || uploading}
          >
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Put it on the shelf'}
          </button>
          <Link to="/admin" className="btn">Cancel</Link>
        </div>
      </div>

      {toast && <Toast message={toast.msg} tone={toast.tone === 'error' ? 'error' : 'ok'} onClose={() => setToast(null)} />}
    </>
  )
}
