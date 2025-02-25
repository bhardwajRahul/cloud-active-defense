import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Decoy } from '../../models/decoy';
import { DecoyService } from '../../services/decoy.service';
import { ToastrService } from 'ngx-toastr';
import { DecoyData } from '../../models/decoy-data';
import { FormsModule } from '@angular/forms';
import { GlobalStateService } from '../../services/global-state.service';
import { isProtectedAppEmpty } from '../../models/protected-app';
import { RouterLink } from '@angular/router';
import { UUID } from '../../models/types';
import { Subscription } from 'rxjs';
import { ConfigmanagerApiService } from '../../services/api/configmanager-api.service';

@Component({
  selector: 'app-list-decoy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './list-decoy.component.html',
  styleUrl: './list-decoy.component.scss'
})
export class ListDecoyComponent implements OnInit, OnDestroy {
  decoys: DecoyData[] = [];
  globalStateSubscription?: Subscription;

  constructor(private decoyService: DecoyService, private toastr: ToastrService, private globalState: GlobalStateService, private configmanagerApi: ConfigmanagerApiService) { }

  async ngOnInit() {
    this.globalStateSubscription = this.globalState.selectedApp$.subscribe(data => {
      if (isProtectedAppEmpty(data)) return;
      this.getDecoyList();
    });
  }

  ngOnDestroy(): void {
    this.globalStateSubscription?.unsubscribe();
    // this.save();
  }

  async getDecoyList() {
    const decoysResponse = await this.decoyService.getDecoys();
    if (decoysResponse.type == 'error') this.toastr.error(decoysResponse.message, "Error");
    this.decoys = decoysResponse.data as DecoyData[] || [];
  }

  displayDecoy(decoy: Decoy): string {
    let key = decoy.decoy.dynamicKey || decoy.decoy.key || '';
    let value = decoy.decoy.dynamicValue || decoy.decoy.value || '';
    return `${key}${value ? decoy.decoy.separator ? decoy.decoy.separator : '=' : ''}${value}`;
  }

  async setDeployed(decoyData: DecoyData) {
    const oldState = decoyData.deployed;
    const updateResponse = await this.decoyService.updateDecoyDeployState(decoyData);
    if (updateResponse.type == 'error') {
      this.toastr.error(updateResponse.message, "Error updating deploy state");
      decoyData.deployed = oldState;
    }
    else {
      this.toastr.success("Successfully updated decoy deploy state", "Saved");
    }
  }
  async deleteDecoy(decoyId: UUID) {
    const saveResponse = await this.decoyService.deleteDecoy(decoyId);
    if (saveResponse.type == 'error') this.toastr.error(saveResponse.message, "Error saving");
    else {
      this.toastr.success("Successfully deleted decoy", "Deleted");
      this.getDecoyList();
    }
  }

  async save() {
    if (!this.decoys.length) return;
    const saveResponse = await this.configmanagerApi.updateConfigmanagerDecoys(this.globalState.selectedApp.id)
    if (saveResponse.type == 'error') this.toastr.error(saveResponse.message, "Error Synchronizing");
    else if (saveResponse.type == 'warning') this.toastr.warning(saveResponse.message, "Warning");
    else {
      this.toastr.success("Successfully synchronized with configmanager", "Synchronized");
      this.getDecoyList()
    }
  }
}
