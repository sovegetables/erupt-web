import {ChangeDetectionStrategy, Component, HostListener} from '@angular/core';
import {RTLService} from '@delon/theme';

@Component({
    selector: 'header-rtl',
    template: `
        {{ rtl.nextDir == 'ltr' ? 'LTR' : 'RTL' }}
    `,
    host: {
        '[class.flex-1]': 'true'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderRTLComponent {
    constructor(public rtl: RTLService) {
    }

    @HostListener('click')
    toggleDirection(): void {
        this.rtl.toggle();
    }
}
