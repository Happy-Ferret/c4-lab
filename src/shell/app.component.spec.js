import LocalStorage from '../../__mocks__/LocalStorage'
import { name } from './app.component'

describe('app.controller', () => {
    let $ctrl

    beforeEach(inject($componentController => {
        $ctrl = $componentController(name, {
            '$window': {
                localStorage: new LocalStorage(),
                document: {
                    createElement: jest.fn()
                }
            }
        }, {})
    }))

    describe('$onInit()', () => {
        it('sets initial text when storage is empty', () => {
            $ctrl.$onInit()

            expect($ctrl.initialText).toBeDefined()
        })

        it('sets initial text from storage', () => {
            $ctrl.storage.save('text')
            $ctrl.$onInit()

            expect($ctrl.initialText).toBe('text')
        })
    })

    describe('onParse()', () => {
        it('sets text and saves to storage', () => {
            $ctrl.onParse('text')

            expect($ctrl.text).toBe('text')
            expect($ctrl.storage.load()).toBe('text')
        })
    })
})
