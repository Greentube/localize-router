import { Injectable, ChangeDetectorRef } from '@angular/core';

@Injectable()
export class ChangeDetectorRefMock extends ChangeDetectorRef {
  _view = { state: 0 };

  markForCheck(): void {
  }

  detach(): void {
  }

  detectChanges(): void {
  }

  checkNoChanges(): void {
  }

  reattach(): void {
  }
}
