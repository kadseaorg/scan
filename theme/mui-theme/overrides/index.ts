import { Theme } from '@mui/material/styles'

import Accordion from './Accordion'
import Autocomplete from './Autocomplete'
import Avatar from './Avatar'
import Backdrop from './Backdrop'
import Badge from './Badge'
import Button from './Button'
import ButtonGroup from './ButtonGroup'
import Card from './Card'
import Checkbox from './Checkbox'
import DataGrid from './DataGrid'
import Dialog from './Dialog'
import Divider from './Divider'
import Drawer from './Drawer'
//
import Link from './Link'
import LoadingButton from './LoadingButton'
import Pagination from './Pagination'
import Paper from './Paper'
import Popover from './Popover'
import Radio from './Radio'
import Select from './Select'
import Skeleton from './Skeleton'
import Slider from './Slider'
import Stepper from './Stepper'
import SvgIcon from './SvgIcon'
import Switch from './Switch'
import Table from './Table'
import Tabs from './Tabs'
import Tooltip from './Tooltip'
import TreeView from './TreeView'
import Typography from './Typography'

export default function ComponentsOverrides(theme: Theme) {
	return Object.assign(
		// Fab(theme),
		Tabs(theme),
		// Chip(theme),
		Card(theme),
		// Menu(theme),
		Link(theme),
		// Input(theme),
		Radio(theme),
		Badge(theme),
		// Lists(theme),
		Table(theme),
		Paper(theme),
		// Alert(theme),
		Switch(theme),
		Select(theme),
		Button(theme),
		// Rating(theme),
		Dialog(theme),
		Avatar(theme),
		Slider(theme),
		Drawer(theme),
		Stepper(theme),
		Tooltip(theme),
		Popover(theme),
		SvgIcon(theme),
		Checkbox(theme),
		DataGrid(theme),
		Skeleton(theme),
		// Timeline(theme),
		TreeView(theme),
		Backdrop(theme),
		// Progress(theme),
		Accordion(theme),
		// DatePicker(theme),
		Typography(theme),
		Pagination(theme),
		ButtonGroup(theme),
		// Breadcrumbs(theme),
		Autocomplete(theme),
		// ControlLabel(theme),
		// ToggleButton(theme),
		LoadingButton(theme),
		Divider(theme),
	)
}
