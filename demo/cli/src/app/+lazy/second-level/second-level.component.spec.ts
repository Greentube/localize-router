import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondLevelComponent } from './second-level.component';

describe('SecondLevelComponent', () => {
  let component: SecondLevelComponent;
  let fixture: ComponentFixture<SecondLevelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondLevelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
