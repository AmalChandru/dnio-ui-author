import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  TemplateRef,
  ElementRef,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModalRef, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import {
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
  RowNode,
} from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import * as moment from 'moment';

import {
  CommonService,
  GetOptions,
} from 'src/app/utils/services/common.service';
import { AppService } from 'src/app/utils/services/app.service';
import { UserDetails } from 'src/app/utils/interfaces/userDetails';
import { Breadcrumb } from 'src/app/utils/interfaces/breadcrumb';
import { GridCheckboxComponent } from 'src/app/utils/grid-checkbox/grid-checkbox.component';
import { UserListCellRendererComponent } from 'src/app/utils/user-list-cell-renderer/user-list-cell-renderer.component';
import { AgGridSharedFloatingFilterComponent } from 'src/app/utils/ag-grid-shared-floating-filter/ag-grid-shared-floating-filter.component';
import { AgGridActionsRendererComponent } from 'src/app/utils/ag-grid-actions-renderer/ag-grid-actions-renderer.component';
import { environment } from 'src/environments/environment';
import { SessionService } from '../../../utils/services/session.service';

@Component({
  selector: 'odp-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  @ViewChild('agGrid') agGrid: AgGridAngular;
  @ViewChild('deleteModal', { static: false })
  deleteModal: TemplateRef<HTMLElement>;
  @ViewChild('searchUserInput', { static: false }) searchUserInput: ElementRef;
  @ViewChild('createEditTemplate', { static: false }) createEditTemplate;
  @ViewChild('removeSelectedModal', { static: false })
  removeSelectedModal: TemplateRef<HTMLElement>;
  deleteModalRef: NgbModalRef;
  searchForm: FormGroup;
  userForm: FormGroup;
  apiConfig: GetOptions = {};
  subscriptions: any = {};
  username: string;
  authType: string;
  errorMessage: string;
  isSuperAdmin: boolean;
  selectedApp: string;
  showLazyLoader: boolean;
  appList = [];
  showUsrManage: boolean;
  selectedUser: any;
  groupList: Array<any>;
  selectedGroups: Array<string>;
  breadcrumbPaths: Array<Breadcrumb>;
  bredcrumbSubject: Subject<string>;
  userInLocal: boolean;
  userInAzureAD: boolean;
  showPassword;
  frameworkComponents: any;
  gridOptions: GridOptions;
  dataSource: IDatasource;
  loadedCount: number;
  totalCount: number;
  removeSelectedModalRef: NgbModalRef;
  userToRemove: string;
  validAuthTypes: Array<any>;
  availableAuthTypes: Array<any>;
  showNewUserWindow: boolean;
  showAzureLoginButton: boolean;
  userList: Array<any> = [];
  checkedUsers: Array<any> = [];
  details: any = {};
  checked: boolean = false;
  isLoading: boolean = true;
  currentTab: string = 'Groups';
  gridApi: GridApi;
  showSettings: boolean = false;
  showResetPassword: boolean = false;
  showPasswordSide: boolean = false;
  resetPasswordForm: FormGroup;
  showAddAttribute: boolean = false;
  attributesForm: FormGroup;
  editMode: boolean = false;
  types: Array<any>;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private ngbToolTipConfig: NgbTooltipConfig,
    private ts: ToastrService,
    private appService: AppService,
    private sessionService: SessionService
  ) {
    this.showUsrManage = true;
    this.selectedApp = this.commonService.app._id;
    this.apiConfig.filter = {};
    this.groupList = [];
    this.selectedGroups = [];
    this.breadcrumbPaths = [];
    this.bredcrumbSubject = new Subject<string>();
    this.showPassword = {};
    this.types = [
      { class: 'odp-abc', value: 'String', label: 'Text' },
      { class: 'odp-123', value: 'Number', label: 'Number' },
      { class: 'odp-boolean', value: 'Boolean', label: 'True/False' },
      { class: 'odp-calendar', value: 'Date', label: 'Date' },
    ];
    this.availableAuthTypes = [
      {
        label: 'Local',
        value: 'local',
      },
      {
        label: 'Azure',
        value: 'azure',
      },
      {
        label: 'LDAP',
        value: 'ldap',
      },
    ];

    this.attributesForm = this.fb.group({
      label: [null],
      type: [null],
      value: [null],
    });

    this.resetPasswordForm = this.fb.group({
      password: [null],
      cpassword: [null, [Validators.required]],
    });

    if (this.commonService.userDetails?.rbacPasswordComplexity) {
      this.resetPasswordForm
        .get('password')
        .setValidators([
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*?~]).+$/
          ),
        ]);
    } else {
      this.resetPasswordForm
        .get('password')
        .setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.resetPasswordForm.get('password').updateValueAndValidity();
  }

  ngOnInit() {
    this.breadcrumbPaths.push({
      active: true,
      label: 'Users',
    });
    this.configureAuthTypes();
    // this.createUserForm();
    this.ngbToolTipConfig.container = 'body';
    this.username = this.commonService.userDetails.username;
    if (
      this.commonService.userDetails.basicDetails &&
      this.commonService.userDetails.basicDetails.name
    ) {
      this.username = this.commonService.userDetails.basicDetails.name;
    }
    this.showResetPassword =
      this.commonService.userDetails.isSuperAdmin ||
      this.isThisUser(this.selectedUser);
    this.isSuperAdmin = this.commonService.userDetails.isSuperAdmin;
    this.initConfig();
    this.commonService.apiCalls.componentLoading = false;
    this.searchForm = this.fb.group({
      searchTerm: ['', Validators.required],
    });

    if (this.hasPermission('PMUG')) {
      this.fetchGroups();
    }
    this.subscriptions['breadCrumbSubs'] = this.bredcrumbSubject.subscribe(
      (usrName) => {
        if (usrName) {
          this.updateBreadCrumb(usrName);
        }
      }
    );
    // this.setupGrid();
    if (
      this.appService.validAuthTypes &&
      this.appService.validAuthTypes.indexOf('azure') == -1
    ) {
      this.showAzureLoginButton = false;
    }
    this.showLazyLoader = true;
    this.getUserList().subscribe((users) => {
      this.userList = users;
      this.details = users[0];
      this.selectedUser = users[0];
      this.showLazyLoader = false;
      this.isLoading = false;
    });
    this.configureGridSettings();
  }

  onAuthTypeChange(value) {
    this.showAzureLoginButton = false;
    if (this.userForm.get('password')) {
      this.userForm.get('password').patchValue(null);
    }
    if (this.userForm.get('cpassword')) {
      this.userForm.get('cpassword').patchValue(null);
    }
    if (this.userForm.get('basicDetails.name:')) {
      this.userForm.get('basicDetails.name:').patchValue(null);
    }
    if (this.userForm.get('basicDetails.phone')) {
      this.userForm.get('basicDetails.phone').patchValue(null);
    }
    if (this.userForm.get('basicDetails.alternateEmail')) {
      this.userForm.get('basicDetails.alternateEmail').patchValue(null);
    }
    if (this.userForm.get('basicDetails.description')) {
      this.userForm.get('basicDetails.description').patchValue(null);
    }
    this.selectedGroups = [];
    if (value === 'azure') {
      this.showLazyLoader = true;
      this.commonService
        .get('user', `/${this.commonService.app._id}/user/utils/azure/token`)
        .subscribe(
          (res) => {
            this.showLazyLoader = false;
            this.showAzureLoginButton = false;
            this.configureFormValidators();
          },
          (err) => {
            this.showLazyLoader = false;
            this.showAzureLoginButton = true;
          }
        );
    } else {
      this.configureFormValidators();
    }
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach((e) => {
      this.subscriptions[e].unsubscribe();
    });
    if (this.deleteModalRef) {
      this.deleteModalRef.close();
    }
  }

  configureAuthTypes() {
    this.authType = this.commonService.userDetails.auth.authType;
    this.validAuthTypes = !!this.appService.validAuthTypes?.length
      ? this.availableAuthTypes.filter((at) =>
          this.appService.validAuthTypes.includes(at.value)
        )
      : [{ label: 'Local', value: 'local' }];
  }

  triggerAzureToken() {
    this.getNewAzureToken()
      .then(() => {
        this.commonService
          .get('user', `/${this.commonService.app._id}/user/utils/azure/token`)
          .subscribe(
            (res) => {
              this.showLazyLoader = false;
              this.showAzureLoginButton = false;
              this.configureFormValidators();
            },
            (err) => {
              this.showLazyLoader = false;
              this.showAzureLoginButton = true;
            }
          );
      })
      .catch((err) => {
        this.commonService.errorToast(
          err,
          'Error while trying to login to Azure AD'
        );
      });
  }

  getNewAzureToken() {
    try {
      const url = `${environment.url.user}/${this.commonService.app._id}/user/utils/azure/token/new`;
      const self = this;
      const windowHeight = 500;
      const windowWidth = 620;
      const windowLeft =
        (window.outerWidth - windowWidth) / 2 + window.screenLeft;
      const windowTop =
        (window.outerHeight - windowHeight) / 2 + window.screenTop;
      const windowOptions = [];
      windowOptions.push(`height=${windowHeight}`);
      windowOptions.push(`width=${windowWidth}`);
      windowOptions.push(`left=${windowLeft}`);
      windowOptions.push(`top=${windowTop}`);
      windowOptions.push(`toolbar=no`);
      windowOptions.push(`resizable=no`);
      windowOptions.push(`menubar=no`);
      windowOptions.push(`location=no`);
      const childWindow = document.open(
        url,
        '_blank',
        windowOptions.join(',')
      ) as any;
      return self.appService.listenForChildClosed(childWindow);
    } catch (e) {
      throw e;
    }
  }

  createUserForm() {
    this.userForm = this.fb.group({
      userData: this.fb.group({
        auth: this.fb.group({
          authType: [
            !!this.validAuthTypes?.length
              ? this.validAuthTypes[0].value
              : 'local',
            [Validators.required],
          ],
        }),
        username: [null],
        password: [null],
        cpassword: [null],
        isSuperAdmin: [false, [Validators.required]],
        attributes: [{}],
        basicDetails: this.fb.group({
          name: [null],
          phone: [null, []],
          alternateEmail: [
            null,
            [Validators.pattern(/[\w]+@[a-zA-Z0-9-]{2,}(\.[a-z]{2,})+/)],
          ],
          description: [null],
        }),
        accessControl: this.fb.group({
          accessLevel: ['Selected', [Validators.required]],
          apps: [[]],
        }),
        roles: [null],
      }),
    });
    this.userInLocal = false;
    this.userInAzureAD = false;
    this.userForm.get('userData.auth.authType').enable();
    this.userForm.get('userData.basicDetails.name').patchValue(null);
    if (this.hasPermission('PMUG')) {
      this.fetchGroups();
    }
    this.configureFormValidators();
  }

  configureFormValidators() {
    const value = this.userForm.get('userData.auth.authType').value;
    this.userForm.get('userData.username').clearValidators();
    this.userForm.get('userData.basicDetails.name').clearValidators();
    this.userForm.get('userData.password').clearValidators();
    this.userForm.get('userData.cpassword').clearValidators();
    if (value === 'local') {
      this.userForm
        .get('userData.username')
        .setValidators([
          Validators.required,
          Validators.pattern(/[\w]+@[a-zA-Z0-9-]{2,}(\.[a-z]{2,})+/),
        ]);
      this.userForm
        .get('userData.basicDetails.name')
        .setValidators([
          Validators.required,
          Validators.pattern('[a-zA-Z0-9\\s-_@#.]+'),
        ]);
      if (this.commonService.userDetails.rbacPasswordComplexity) {
        this.userForm
          .get('userData.password')
          .setValidators([
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*?~]).+$/
            ),
          ]);
      } else {
        this.userForm
          .get('userData.password')
          .setValidators([Validators.required, Validators.minLength(8)]);
      }
      this.userForm
        .get('userData.cpassword')
        .setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      this.userForm
        .get('userData.username')
        .setValidators([Validators.required]);
      this.userForm
        .get('userData.basicDetails.name')
        .setValidators([Validators.pattern('[a-zA-Z0-9\\s-_@#.]+')]);
    }
    this.userForm.get('userData.username').updateValueAndValidity();
    this.userForm.get('userData.basicDetails.name').updateValueAndValidity();
    this.userForm.get('userData.password').updateValueAndValidity();
    this.userForm.get('userData.cpassword').updateValueAndValidity();
  }

  onGridAction(buttonName: string, rowNode: RowNode) {
    switch (buttonName) {
      case 'View':
        {
          this.onRowDoubleClick(rowNode);
        }
        break;
      case 'Remove':
        {
          this.removeUsers({ userIds: [rowNode.data._id], single: true });
        }
        break;
    }
  }

  onGridReady(event: GridReadyEvent) {
    this.gridApi = event.api;
    this.forceResizeColumns();
    this.configureGrid();
  }

  private forceResizeColumns() {
    this.agGrid.api.sizeColumnsToFit();
    this.autoSizeAllColumns();
  }

  private autoSizeAllColumns() {
    const pinnedContentSize = this.hasPermission('PMUBD') ? 170 : 94;
    if (!!this.agGrid.api && !!this.agGrid.columnApi) {
      setTimeout(() => {
        const container = document.querySelector('.grid-container');
        const availableWidth = !!container
          ? container.clientWidth - pinnedContentSize
          : 1070;
        const allColumns = this.agGrid.columnApi.getAllColumns();
        allColumns.forEach((col) => {
          this.agGrid.columnApi.autoSizeColumn(col);
          if (
            col.getActualWidth() > 200 ||
            this.agGrid.api.getDisplayedRowCount() === 0
          ) {
            col.setActualWidth(200);
          }
        });
        const occupiedWidth = allColumns.reduce(
          (pv, cv) => pv + cv.getActualWidth(),
          -pinnedContentSize
        );
        if (occupiedWidth < availableWidth) {
          this.agGrid.api.sizeColumnsToFit();
        }
      }, 2000);
    }
  }

  private onRowDoubleClick(row: any) {
    this.editUser(row);
  }

  checkAllUser(val) {
    this.agGrid.api.forEachNode((row) => {
      this.agGrid.api.getRowNode(row.id).selectThisNode(val);
    });
  }

  initConfig() {
    this.appList = this.commonService.appList;
    this.apiConfig.count = 30;
    this.apiConfig.page = 1;
    this.apiConfig.noApp = true;
    this.apiConfig.filter = {
      bot: false,
    };
  }

  get isSelectAllDisabled(): boolean {
    return !this.totalCount;
  }

  get selectedUsers(): Array<any> {
    return this.agGrid?.api?.getSelectedRows() || [];
  }

  get isAllUserChecked() {
    if (!!this.agGrid?.api) {
      const selectedNodes = this.agGrid.api.getSelectedNodes();
      const visibleRowCount = this.agGrid.api.getInfiniteRowCount();
      return (
        !!selectedNodes.length && visibleRowCount - selectedNodes.length < 2
      );
    }
    return false;
  }

  get invalidName() {
    return (
      this.userForm.get('userData.basicDetails.name').dirty &&
      this.userForm.get('userData.basicDetails.name').hasError('required')
    );
  }

  get invalidAuthType() {
    return (
      this.userForm.get('userData.auth.authType').dirty &&
      this.userForm.get('userData.auth.authType').hasError('required')
    );
  }

  get invalidUsername() {
    return (
      this.userForm.get('userData.username').dirty &&
      this.userForm.get('userData.username').hasError('required')
    );
  }

  get invalidUsernamePattern() {
    return (
      this.userForm.get('userData.username').dirty &&
      this.userForm.get('userData.username').hasError('pattern')
    );
  }

  get invalidEmailPattern() {
    return (
      this.userForm.get('userData.basicDetails.alternateEmail').dirty &&
      this.userForm
        .get('userData.basicDetails.alternateEmail')
        .hasError('pattern')
    );
  }

  get invalidPassword() {
    return (
      this.userForm.get('userData.password').dirty &&
      this.userForm.get('userData.password').hasError('required')
    );
  }

  get invalidPasswordLength() {
    return (
      this.userForm.get('userData.password').dirty &&
      this.userForm.get('userData.password').hasError('minlength')
    );
  }

  get invalidPasswordPattern() {
    if (this.commonService.userDetails.rbacPasswordComplexity) {
      return (
        this.userForm.get('userData.password').dirty &&
        this.userForm.get('userData.password').hasError('pattern')
      );
    } else {
      return false;
    }
  }

  get invalidCPassword() {
    return (
      this.userForm.get('userData.cpassword').dirty &&
      this.userForm.get('userData.cpassword').hasError('required')
    );
  }
  get invalidPasswordMatch() {
    return (
      this.userForm.get('userData.cpassword').dirty &&
      this.userForm.get('userData.password').dirty &&
      this.userForm.get('userData.cpassword').value !==
        this.userForm.get('userData.password').value
    );
  }

  get isElevatedUser() {
    const self = this;
    const logedInUser = self.sessionService.getUser(true);
    if (self.details._id === logedInUser._id) {
      return false;
    } else {
      const isSuperAdmin = logedInUser.isSuperAdmin;
      let isAppAdmin = false;
      if (
        logedInUser.accessControl.apps &&
        logedInUser.accessControl.apps.length > 0
      ) {
        const i = logedInUser.accessControl.apps.findIndex(
          (_app) => _app._id === self.commonService.app._id
        );
        if (i !== -1) {
          isAppAdmin = true;
        }
      }
      return isSuperAdmin || isAppAdmin;
    }
  }

  getLabelError() {
    return (
      this.attributesForm.get('label').touched &&
      this.attributesForm.get('label').hasError('required')
    );
  }

  getValError() {
    return (
      this.attributesForm.get('value').touched &&
      this.attributesForm.get('value').hasError('required')
    );
  }

  newUser() {
    this.showSettings = false;
    this.showPassword = {};
    if (this.validAuthTypes?.length === 1) {
      this.userForm.get('userData.auth.authType').disable();
    }
    this.showNewUserWindow = true;
    this.createUserForm();
  }

  closeWindow(reset?: boolean) {
    if (reset) {
      this.userInLocal = false;
      this.userInAzureAD = false;
      this.userForm.reset();
      this.userForm.get('userData.auth.authType').enable();
      this.selectedGroups = [];
    }
    this.showNewUserWindow = false;
    this.showPasswordSide = false;
    this.showAddAttribute = false;
  }

  addUser() {
    this.userForm.get('userData.auth.authType').enable();
    this.userForm.get('userData.basicDetails.name').markAsDirty();
    this.userForm.get('userData.username').markAsDirty();
    this.userForm.get('userData.password').markAsDirty();
    this.userForm.get('userData.cpassword').markAsDirty();
    if (this.userForm.invalid) {
      return;
    } else if (
      this.userForm.get('userData.password').value !==
      this.userForm.get('userData.cpassword').value
    ) {
      this.ts.error('Passwords mismatch');
      return;
    } else {
      this.createAndAddToGroup();
    }
  }

  importUser() {
    this.userForm.get('userData.auth.authType').enable();
    const payload = {
      groups: this.selectedGroups,
    };
    const username = this.userForm.get('userData.username').value;
    this.showLazyLoader = true;
    this.commonService
      .put(
        'user',
        `/${this.commonService.app._id}/user/utils/import/${username}`,
        payload
      )
      .subscribe(
        (res) => {
          this.showLazyLoader = false;
          this.closeWindow(true);
          this.initConfig();
          this.agGrid.api?.purgeInfiniteCache();
          this.ts.success('User Imported successfully');
          this.userInLocal = false;
          this.userInAzureAD = false;
        },
        (err) => {
          this.showLazyLoader = false;
          this.commonService.errorToast(err);
          this.userInLocal = false;
          this.userInAzureAD = false;
        }
      );
  }

  importUserFromAzure() {
    this.userForm.get('userData.auth.authType').enable();
    const user = this.userForm.get('userData').value;
    const payload = {
      users: [user],
      groups: this.selectedGroups,
    };
    this.showLazyLoader = true;
    this.commonService
      .put(
        'user',
        `/${this.commonService.app._id}/user/utils/azure/import`,
        payload
      )
      .subscribe(
        (res) => {
          this.showLazyLoader = false;
          this.closeWindow(true);
          this.initConfig();
          this.agGrid.api?.purgeInfiniteCache();
          this.ts.success('User Imported successfully');
          this.userInLocal = false;
          this.userInAzureAD = false;
        },
        (err) => {
          this.showLazyLoader = false;
          this.commonService.errorToast(err);
          this.userInLocal = false;
          this.userInAzureAD = false;
        }
      );
  }

  createAndAddToGroup() {
    const userData = this.userForm.get('userData').value;
    const payload = {
      user: userData,
      groups: this.selectedGroups,
    };
    this.showLazyLoader = true;
    this.commonService
      .post('user', `/${this.commonService.app._id}/user`, payload)
      .subscribe(
        (res) => {
          this.showLazyLoader = false;
          this.closeWindow(true);
          this.initConfig();
          this.agGrid.api?.purgeInfiniteCache();
          this.ts.success('User created successfully');
        },
        (err) => {
          this.showLazyLoader = false;
          this.commonService.errorToast(err);
        }
      );
  }

  checkForDuplicate() {
    const enteredUN = this.userForm.get('userData.username').value;
    if (!enteredUN) {
      return;
    }
    if (this.agGrid.api.getRowNode(enteredUN)) {
      this.ts.warning('User already exist in this app.');
      this.userForm.get('userData.username').patchValue(null);
      return;
    }
    this.showLazyLoader = true;
    this.commonService.get('user', `/auth/authType/${enteredUN}`).subscribe(
      (res) => {
        this.showLazyLoader = false;
        this.userInLocal = true;
        this.userInAzureAD = false;
        this.userForm.get('userData.auth.authType').patchValue(res.authType);
        this.userForm.get('userData.auth.authType').disable();
        setTimeout(() => {
          this.userForm.get('userData.basicDetails.name').patchValue(res.name);
          this.userForm.get('userData.basicDetails.name').disable();
        }, 1000);
      },
      (err) => {
        this.showLazyLoader = false;
        this.userInLocal = false;
        this.userInAzureAD = false;
        this.userForm.get('userData.auth.authType').enable();
        this.userForm.get('userData.basicDetails.name').patchValue(null);
        this.userForm.get('userData.basicDetails.name').enable();
        this.userForm
          .get('userData.basicDetails.alternateEmail')
          .patchValue(null);
        if (
          this.selectedAuthType == 'azure' &&
          this.validAuthTypes.findIndex((e) => e.value === 'azure') > -1
        ) {
          this.checkForUserInAzure();
        }
      }
    );
  }

  checkForUserInAzure() {
    const enteredUN = this.userForm.get('userData.username').value;
    if (!enteredUN) {
      return;
    }
    this.showLazyLoader = true;
    this.commonService
      .put('user', `/${this.commonService.app._id}/user/utils/azure/search`, {
        users: [enteredUN],
      })
      .subscribe(
        (res) => {
          this.showLazyLoader = false;
          this.userInLocal = false;
          let userData;
          let statusCode;
          if (Array.isArray(res)) {
            userData = res[0].body;
            statusCode = res[0].statusCode;
          } else {
            userData = res.body;
            statusCode = res.statusCode;
          }
          if (statusCode != 200) {
            this.commonService.errorToast(null, 'User not found in Azure AD');
            this.userInAzureAD = false;
            return;
          }
          this.userInAzureAD = true;
          this.userForm.get('userData.auth.authType').patchValue('azure');
          this.userForm.get('userData.auth.authType').disable();
          this.userForm
            .get('userData.basicDetails.name')
            .patchValue(userData.name);
          this.userForm.get('userData.basicDetails.name').disable();
          if (userData.phone) {
            this.userForm
              .get('userData.basicDetails.phone')
              .patchValue(userData.phone);
          }
          if (userData.email) {
            this.userForm
              .get('userData.basicDetails.alternateEmail')
              .patchValue(userData.email);
          }
        },
        (err) => {
          this.showLazyLoader = false;
          this.userInLocal = false;
          this.userInAzureAD = false;
          this.userForm.get('userData.auth.authType').enable();
          this.userForm.get('userData.basicDetails.name').patchValue(null);
          this.userForm.get('userData.basicDetails.name').enable();
          this.userForm
            .get('userData.basicDetails.alternateEmail')
            .patchValue(null);
          // if(this.validAuthTypes.findIndex(e=>e.value === 'ldap') > -1){
          //     this.checkForUserInLDAP();
          // }
        }
      );
  }

  // checkForUserInLDAP(){

  // }

  fetchGroups() {
    this.subscriptions['fetchGroups'] = this.commonService
      .get('user', `/${this.commonService.app._id}/group`, {
        noApp: true,
        count: -1,
        select: 'name',
      })
      .subscribe(
        (groups) => {
          this.groupList = groups;
          const index = this.groupList.findIndex((e) => e.name === '#');
          if (index >= 0) {
            this.groupList.splice(index, 1);
          }
        },
        (err) => {}
      );
  }

  getUserCount() {
    const options = {
      filter: this.apiConfig.filter,
      noApp: true,
    };
    return this.commonService.get(
      'user',
      `/${this.commonService.app._id}/user/utils/count`,
      options
    );
  }

  getUserList() {
    return this.commonService.get(
      'user',
      `/${this.commonService.app._id}/user`,
      this.apiConfig
    );
  }

  hasPermission(type: string) {
    return this.commonService.hasPermission(type);
  }

  getLastActiveTime(time) {
    if (time) {
      const lastLoggedIn = new Date(time);
      return moment(lastLoggedIn).fromNow() === 'a day ago'
        ? '1 day ago'
        : moment(lastLoggedIn).fromNow();
    }
    return;
  }

  editUser(event: any, flag?: boolean) {
    if (
      !this.hasPermission('PVUB') &&
      !this.commonService.hasPermissionStartsWith('PMU')
    ) {
      return;
    }
    if (flag) {
      this.appService.editUser = true;
    }
    this.showUsrManage = true;
    this.selectedUser = event.data;
    this.updateBreadCrumb(this.selectedUser?.basicDetails?.name || '');
  }

  search(event) {
    if (
      !this.searchForm.value.searchTerm ||
      this.searchForm.value.searchTerm.trim() === ''
    ) {
      this.apiConfig.filter = {
        bot: false,
      };
    } else {
      this.apiConfig.filter = {
        username: '/' + this.searchForm.value.searchTerm + '/',
        'basicDetails.name': '/' + this.searchForm.value.searchTerm + '/',
        bot: false,
      };
    }
    this.agGrid.api.purgeInfiniteCache();
  }

  canEdit(user: UserDetails) {
    if (
      user._id === this.commonService.userDetails._id ||
      (user.isSuperAdmin && !this.commonService.userDetails.isSuperAdmin)
    ) {
      return false;
    }
    return true;
  }

  canDelete(user: UserDetails) {
    if (
      user._id === this.commonService.userDetails._id ||
      (user.isSuperAdmin && !this.commonService.userDetails.isSuperAdmin)
    ) {
      return false;
    }
    return true;
  }

  isThisUser(user) {
    return user._id === this.commonService.userDetails?._id;
  }

  updateBreadCrumb(usr) {
    if (this.breadcrumbPaths.length === 2) {
      this.breadcrumbPaths.pop();
    }
    this.breadcrumbPaths.push({
      active: true,
      label: usr,
    });
  }

  removeSelectedUsers(userIds?: Array<string>) {
    if (!userIds) {
      userIds = this.selectedUsers.map((e) => e._id);
    }
    if (!userIds || userIds.length === 0) {
      return;
    }
    this.subscriptions['removeUsers'] = this.commonService
      .put('user', `/${this.commonService.app._id}/user/utils/removeUsers`, {
        userIds,
      })
      .subscribe(
        () => {
          this.agGrid.api.deselectAll();
          setTimeout(() => {
            this.agGrid.api.purgeInfiniteCache();
          }, 500);
          this.ts.success(
            `Removed User(s) from ${this.selectedApp} App Successfully`
          );
        },
        (err) => {
          console.log(err);
          this.agGrid.api.deselectAll();
          setTimeout(() => {
            this.agGrid.api.purgeInfiniteCache();
          }, 500);
          this.commonService.errorToast(
            err,
            'unable to remove selected user(s), please try after sometime'
          );
        }
      );
  }

  removeUsers(params?: { userIds?: Array<string>; single?: boolean }) {
    if (!!params?.single) {
      this.userToRemove = !!params.userIds?.length ? params.userIds[0] : null;
    }
    this.removeSelectedModalRef = this.commonService.modal(
      this.removeSelectedModal
    );
    this.removeSelectedModalRef.result.then(
      (close) => {
        this.userToRemove = null;
        if (close) {
          this.removeSelectedUsers(params?.userIds);
        } else {
          this.removeSelectedModalRef.close(true);
        }
      },
      (dismiss) => {
        this.userToRemove = null;
      }
    );
  }

  insufficientPermission() {
    this.ts.warning("You don't have enough permissions");
  }

  isAppAdmin(user: UserDetails) {
    return !!(
      user.accessControl.apps &&
      user.accessControl.apps.length > 0 &&
      user.accessControl.apps.find((e) => e._id === this.commonService.app._id)
    );
  }

  sortModelChange(model: any) {
    this.apiConfig.sort = this.appService.getSortQuery(model);
    this.agGrid.api.purgeInfiniteCache();
  }

  toggleGroup(flag: boolean, groupId: string) {
    const index = this.selectedGroups.findIndex((e) => e === groupId);
    if (flag && index == -1) {
      this.selectedGroups.push(groupId);
    }
    if (!flag && index > -1) {
      this.selectedGroups.splice(index, 1);
    }
  }

  isGroupSelected(groupId: string) {
    return this.selectedGroups.includes(groupId);
  }

  get disableImport() {
    const authType = this.userForm.get('userData.auth.authType').value;
    if (authType == 'azure' && !this.userInAzureAD && !this.userInLocal) {
      return true;
    }
    return false;
  }

  get selectedAuthType() {
    return this.userForm.get('userData.auth.authType').value;
  }

  get matchPwd() {
    const self = this;
    return (
      self.resetPasswordForm.get('password').value !==
      self.resetPasswordForm.get('cpassword').value
    );
  }

  get pwdError() {
    const self = this;
    return (
      (self.resetPasswordForm.get('password').dirty &&
        self.resetPasswordForm.get('password').hasError('required')) ||
      (self.resetPasswordForm.get('password').dirty &&
        self.resetPasswordForm.get('password').hasError('minlength')) ||
      (self.resetPasswordForm.get('password').dirty &&
        self.resetPasswordForm.get('password').hasError('pattern'))
    );
  }

  get cPwdError() {
    const self = this;
    return (
      (self.resetPasswordForm.get('cpassword').dirty &&
        self.resetPasswordForm.get('cpassword').hasError('required')) ||
      (self.resetPasswordForm.get('cpassword').dirty && self.matchPwd)
    );
  }

  formatLastLogin(timestamp, isDetails = false) {
    if (isDetails) {
      return moment(timestamp).format('hh:mm A , DD/MM/YYYY');
    } else {
      if (
        moment(timestamp).format('DD/MM/YYYY') ===
        moment(new Date()).format('DD/MM/YYYY')
      ) {
        return moment(timestamp).format('hh:mm A');
      } else {
        return moment(timestamp).format('DD/MM/YYYY');
      }
    }
  }

  showDetails(user) {
    this.showSettings = false;
    if (user.attributes && user.attributes !== null) {
      user.attributesData = Object.values(user.attributes);
    }
    this.details = user;
    this.configureGridSettings();
    if (this.gridApi) {
      this.configureGrid();
    }
    // this.gridApi.refreshCells();
  }
  clickCheckbox(event, user) {
    if (event.target.checked) {
      this.checkedUsers.push(user);
    } else {
      this.checkedUsers = this.checkedUsers.filter(
        (ele) => ele._id !== user._id
      );
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    this.configureGridSettings();
    if (this.gridApi) {
      this.configureGrid();
    }
  }

  configureGridSettings() {
    const self = this;

    const columnDefs =
      self.currentTab === 'Groups'
        ? [
            {
              headerName: 'NAME',
              field: 'label',
              filter: false,
            },
            {
              headerName: 'AUHTOR',
              field: 'type',
              filter: false,
            },
            {
              headerName: 'APPCENTER',
              field: 'value',
              filter: false,
            },
          ]
        : [
            {
              headerName: 'LABEL',
              field: 'label',
              filter: false,
            },
            {
              headerName: 'TYPE',
              field: 'type',
              filter: false,
            },
            {
              headerName: 'VALUE',
              field: 'value',
              filter: false,
            },
          ];
    self.gridOptions = {
      frameworkComponents: this.frameworkComponents,
      rowDeselection: false,
      suppressPaginationPanel: true,
      columnDefs: columnDefs,
      paginationPageSize: 30,
      suppressRowClickSelection: true,
      rowSelection: 'single',
      rowModelType: 'infinite',
      cacheBlockSize: 30,
      floatingFilter: false,
      overlayLoadingTemplate: '<div class="mini-loader"></div>',
      datasource: this.dataSource,
      pagination: false,
      animateRows: true,
      rowHeight: 48,
    };
  }

  configureGrid() {
    const self = this;
    self.dataSource =
      this.currentTab === 'Attributes'
        ? {
            getRows: (params: IGetRowsParams) => {
              this.gridApi.showLoadingOverlay();
              params.successCallback(
                self.details.attributesData,
                self.details.attributesData.length
              );
              if (self.details.attributesData.length < 1 && this.gridApi) {
                this.gridApi.showNoRowsOverlay();
              } else {
                if (self.details.attributesData.length !== 0 && this.gridApi) {
                  this.gridApi.hideOverlay();
                }
              }
            },
          }
        : {
            getRows: (params: IGetRowsParams) => {
              this.gridApi.showLoadingOverlay();
              params.successCallback(
                self.details.attributesData,
                self.details.attributesData.length
              );
              if (self.details.attributesData.length < 1 && this.gridApi) {
                this.gridApi.showNoRowsOverlay();
              } else {
                if (self.details.attributesData.length !== 0 && this.gridApi) {
                  this.gridApi.hideOverlay();
                }
              }
            },
          };
    this.gridApi.setDatasource(this.dataSource);
    // this.gridApi.refreshCells();
  }

  togglePasswordChange() {
    this.showPasswordSide = true;
  }

  resetPassword() {
    const self = this;
    self.resetPasswordForm.get('password').markAsDirty();
    self.resetPasswordForm.get('cpassword').markAsDirty();
    if (self.resetPasswordForm.invalid) {
      return;
    } else {
      if (self.subscriptions['resetPwd']) {
        self.subscriptions['resetPwd'].unsubscribe();
      }
      self.subscriptions['resetPwd'] = self.commonService
        .put(
          'user',
          `/${this.commonService.app._id}/user/utils/reset/${self.details._id}`,
          self.resetPasswordForm.value
        )
        .subscribe(
          (res) => {
            if (
              res &&
              self.details._id === self.commonService.userDetails._id
            ) {
              self.ts.success(
                'Redirecting to login screen, Please login again'
              );
              setTimeout(() => {
                self.commonService.logout();
              }, 3000);
            } else if (res) {
              self.ts.success('Password changed successfully');
            }
          },
          (err) => {
            self.commonService.errorToast(
              err,
              'Unable to change password, please try again later'
            );
          }
        );
      self.resetPasswordForm.reset();
      // self.resetPwd = false;
    }
  }

  showAttributeSide() {
    this.showAddAttribute = true;
    this.attributesForm.reset();
    this.attributesForm = this.fb.group({
      key: [''],
      type: ['String', [Validators.required]],
      value: ['', [Validators.required]],
      label: ['', [Validators.required]],
    });
    this.attributesForm
      .get('label')
      .valueChanges.pipe(filter(() => !this.editMode))
      .subscribe((val: any) => {
        this.attributesForm
          .get('key')
          .patchValue(this.appService.toCamelCase(val));
      });
  }

  onAttributeFormTypeChange(type: any) {
    this.attributesForm.get('type').setValue(type);
    this.attributesForm
      .get('value')
      .setValue(type === 'Boolean' ? false : null);
  }

  addAttribute() {
    const { key, ...rest } = this.attributesForm.getRawValue();
    this.details.attributes[key] = this.appService.cloneObject(rest);
    delete this.details.attributesData;
    this.commonService
      .put(
        'user',
        `/${this.commonService.app._id}/user/${this.details._id}`,
        this.details
      )
      .subscribe(
        () => {
          this.getUserList().subscribe((users) => {
            this.userList = users;
            this.details = users.find((user) => user._id === this.details._id);
            this.selectedUser = this.details;
            this.showLazyLoader = false;
            this.isLoading = false;
            this.configureGridSettings();
            this.configureGrid();
          });
          this.showAddAttribute = false;
          this.ts.success('Custom Details Saved Successfully');
        },
        (err) => {
          this.ts.error(err.error.message);
        }
      );
  }

  set setUserAttributeValue(val) {
    this.attributesForm.get('value').patchValue(val);
  }
}
