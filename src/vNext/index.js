import * as angular from 'angular'
import configureRoutes from './routes'
import * as app from './app.component'
import * as nav from './nav.component'
import * as editor from './editor.component'
import 'angular-ui-codemirror'

const MODULE_NAME = 'c4-lab.vNext';

angular.module(MODULE_NAME, ['ui.bootstrap', 'ui.codemirror'])
    .component(app.name, app.options)
    .component(nav.name, nav.options)
    .component(editor.name, editor.options)
    .config(configureRoutes)
    .run(editor.install)

export default MODULE_NAME;