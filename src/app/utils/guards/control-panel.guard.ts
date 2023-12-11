import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../services/common.service';

@Injectable()
export class ControlPanelGuard  {

  constructor(private router: Router, private commonService: CommonService) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.commonService.hasPermissionStartsWith('PMU')
      || this.commonService.hasPermissionStartsWith('PVU')
      || this.commonService.hasPermissionStartsWith('PMG')
      || this.commonService.hasPermissionStartsWith('PVG')
      || this.commonService.hasPermissionStartsWith('PMBM')
      || this.commonService.hasPermissionStartsWith('PVBM')
      || this.commonService.hasPermissionStartsWith('PVIS')) {
      return true;
    } else {
      this.router.navigate(['/app', this.commonService.app._id, 'noAccess']);
      return false;
    }
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(next, state);
  }
}
