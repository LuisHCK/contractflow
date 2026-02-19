import { getSystemSetting, setSystemSetting } from '@/services/system-settings'
import {
	DEFAULT_INVOICE_FORMAT,
	INVOICE_FORMAT_SETTING_KEY,
	getInvoiceFormatOptions,
	isInvoiceFormatSupported,
	normalizeInvoiceFormat
} from '@/services/invoice-formats'

/**
 * Display and update system settings.
 *
 * GET  /settings -> show settings actions
 */
export const index = async (req, res) => {
	try {
		const viewModel = await buildSettingsViewModel(req)
		return res.render('app/settings/index', viewModel)
	} catch (error) {
		console.error(`Error handling system settings: ${error.message}`)
		return res
			.status(500)
			.send('An error occurred while updating system settings. Please try again later.')
	}
}

export const updateInvoiceFormat = async (req, res) => {
	try {
		const requester = req.user
		if (!requester || requester.role !== 'admin') {
			req.flash('danger', 'Unauthorized')
			return res.status(403).redirect('/settings')
		}

		const requestedFormat = String(req.body.invoiceFormat || '').trim()

		if (!isInvoiceFormatSupported(requestedFormat)) {
			req.flash('danger', req.__('system_settings_invoice_format_invalid'))
			return res.status(400).redirect('/settings')
		}

		const normalizedFormat = normalizeInvoiceFormat(requestedFormat)

		await setSystemSetting(INVOICE_FORMAT_SETTING_KEY, normalizedFormat, {
			userId: requester.id,
			details: 'Default invoice print format'
		})

		req.flash('success', req.__('system_settings_invoice_format_saved'))
		return res.redirect('/settings')
	} catch (error) {
		console.error(`Error updating invoice format: ${error.message}`)
		req.flash('danger', req.__('system_settings_invoice_format_update_failed'))
		return res.status(500).redirect('/settings')
	}
}

const buildSettingsViewModel = async (req) => {
	const selectedInvoiceFormat = normalizeInvoiceFormat(
		await getSystemSetting(INVOICE_FORMAT_SETTING_KEY, DEFAULT_INVOICE_FORMAT)
	)

	const invoiceFormatOptions = getInvoiceFormatOptions().map((item) => ({
		value: item.key,
		label: req.__(item.labelKey),
		selected: item.key === selectedInvoiceFormat
	}))

	const actions = [
		{
			key: 'invoice-format',
			title: req.__('system_settings_invoice_format_title'),
			description: req.__('system_settings_invoice_format_description'),
			action: '/settings/invoice-format',
			submitLabel: req.__('system_settings_invoice_format_save'),
			fields: [
				{
					type: 'select',
					name: 'invoiceFormat',
					label: req.__('system_settings_invoice_format_label'),
					required: true,
					options: invoiceFormatOptions,
					help: req.__('system_settings_invoice_format_help')
				}
			]
		}
	]

	return {
		title: 'system_settings_page_title',
		actions
	}
}

