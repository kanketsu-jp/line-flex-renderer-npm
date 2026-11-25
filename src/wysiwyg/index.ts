// WYSIWYG エディタ（別入口）— renderer（root）の zero-dep を崩さないため分離
export type {
	FlexImageUploadHandler,
	FlexWysiwygEditorProps,
} from "./editor/FlexWysiwygEditor";
export { FlexWysiwygEditor } from "./editor/FlexWysiwygEditor";
