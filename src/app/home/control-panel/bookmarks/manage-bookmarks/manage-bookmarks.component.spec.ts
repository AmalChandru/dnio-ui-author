import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageBookmarksComponent } from './manage-bookmarks.component';

describe('ManageBookmarksComponent', () => {
  let component: ManageBookmarksComponent;
  let fixture: ComponentFixture<ManageBookmarksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageBookmarksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageBookmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
