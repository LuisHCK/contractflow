import { getSystemSetting, setSystemSetting } from '@/services/system-settings'

const CURRENCY_KEY = 'currency'

/**
 * Display and update grouped system settings.
 * Currently includes only currency, but is ready for more groups.
 *
 * GET  /settings -> show settings groups
 * POST /settings -> update settings
 */
export const index = async (req, res) => {
	try {
		const { method, body, user } = req

		if (method === 'POST') {
			const currencyValue = (body.currency || '').trim()

			if (!currencyValue) {
				const viewModel = await buildSettingsViewModel(req, {
					currency: body.currency || ''
				})

				return res.render('app/settings/index', {
					...viewModel,
					error: req.__('system_settings_currency_error')
				})
			}

			await setSystemSetting(CURRENCY_KEY, currencyValue, {
				userId: user?.id,
				details: 'Default currency code (e.g. USD, EUR, MXN)'
			})

			const viewModel = await buildSettingsViewModel(req)
			return res.render('app/settings/index', {
				...viewModel,
				success: req.__('system_settings_saved_successfully')
			})
		}

		const viewModel = await buildSettingsViewModel(req)
		return res.render('app/settings/index', viewModel)
	} catch (error) {
		console.error(`Error handling system settings: ${error.message}`)
		return res
			.status(500)
			.send('An error occurred while updating system settings. Please try again later.')
	}
}

const buildSettingsViewModel = async (req, overrides = {}) => {
	const currentCurrency =
		overrides.currency !== undefined
			? overrides.currency
			: await getSystemSetting(CURRENCY_KEY, '')

	const groups = [
		{
			key: 'general',
			title: req.__('system_settings_group_general_title'),
			description: req.__('system_settings_group_general_description'),
			fields: [
				{
					type: 'text',
					name: 'currency',
					label: req.__('system_settings_currency_label'),
					placeholder: req.__('system_settings_currency_placeholder'),
					required: true,
					value: currentCurrency || ''
				}
			]
		}
	]

	return {
		title: 'system_settings_page_title',
		submitLabel: 'system_settings_submit_label',
		groups
	}
}

