type ButtonVariant = 'primary' | 'outline' | 'social-white' | 'social-dark'

const form_variant_classes = 'rounded-lg'
const social_variant_classes = 'rounded-xl text-sm font-semibold'

const SPINNER_VARIANT_BY_BUTTON: Record<ButtonVariant, 'gray' | 'blue' | 'dark'> = {
	primary: 'dark',
	outline: 'blue',
	'social-white': 'blue',
	'social-dark': 'dark',
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	primary: `bg-blue-600 text-white hover:bg-blue-700 font-semibold dark:bg-blue-500 dark:hover:bg-blue-600 ${form_variant_classes}`,
	outline: `border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 ${form_variant_classes}`,
	'social-white': `${social_variant_classes} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`,
	'social-dark': `${social_variant_classes} border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600`,
}

const COMMON_BUTTON_CLASSES =
	'flex w-full items-center justify-center gap-3 px-4 py-3 transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-50'

const loading_button_styles = {
	COMMON_BUTTON_CLASSES,
	SPINNER_VARIANT_BY_BUTTON,
	VARIANT_CLASSES,
}

export type { ButtonVariant }
export { loading_button_styles }
