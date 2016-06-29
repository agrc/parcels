#!/usr/bin/env python
# * coding: utf8 *
'''
Pallet.py

A module that contains a pallet to update the parcels for the parcel app
'''

import arcpy
from forklift import seat
from forklift.models import Pallet
from os.path import basename
from os.path import join
from os.path import exists
from random import choice
from time import clock


class ParcelPallet(Pallet):

    def __init__(self):
        super(ParcelPallet, self).__init__()

        self.arcgis_services = [('Parcels', 'MapServer')]
        self.temporary_workspace = 'C:\\Scheduled\\Staging\\cadastre.gdb'
        self.destination_workspace = 'C:\\Scheduled\\Staging\\parcels.gdb'
        self.destination_fc_name = 'StateWideParcels'
        self.copy_data = [self.destination_workspace]

        self._fields = [
            ['PARCEL_ID', 'Parcel Id', 'TEXT', 'NULLABLE', 50], ['PARCEL_ADD', 'Address', 'TEXT', 'NULLABLE', 60],
            ['PARCEL_CITY', 'City', 'TEXT', 'NULLABLE', 30], ['PARCEL_ZIP', 'Zip Code', 'TEXT', 'NULLABLE', 10],
            ['OWN_TYPE', 'Generalized Ownership Type', 'TEXT', 'NULLABLE', 20], ['RECORDER', 'Recorder Contact', 'TEXT', 'NULLABLE', 50],
            ['ParcelsCur', 'Current as of', 'DATE', 'NULLABLE'], ['ParcelNotes', 'Notes', 'TEXT', 'NULLABLE', 50],
            ['County', 'County', 'TEXT', 'NON_NULLABLE', 50], ['CoParcel_URL', 'County Parcel Website', 'TEXT', 'NULLABLE', 150]
        ]

    def build(self, target):
        self._create_workspace(self.temporary_workspace)
        self._create_workspace(self.destination_workspace)

        self.add_crates(
            ['Parcels_Beaver', 'Parcels_BoxElder', 'Parcels_Cache', 'Parcels_Carbon', 'Parcels_Daggett',
             'Parcels_Davis', 'Parcels_Duchesne', 'Parcels_Emery', 'Parcels_Garfield', 'Parcels_Grand', 'Parcels_Iron',
             'Parcels_Juab', 'Parcels_Kane', 'Parcels_Millard', 'Parcels_Morgan', 'Parcels_Piute', 'Parcels_Rich',
             'Parcels_SaltLake', 'Parcels_SanJuan', 'Parcels_Sanpete', 'Parcels_Sevier', 'Parcels_Summit',
             'Parcels_Tooele', 'Parcels_Uintah', 'Parcels_Utah', 'Parcels_Wasatch', 'Parcels_Washington',
             'Parcels_Wayne', 'Parcels_Weber'], {'source_workspace': join(self.garage, 'SGID10.sde'),
                                                 'destination_workspace': self.temporary_workspace})

    def process(self):
        #: squash 29 county layers into 1 with 9 attributes used by the app
        start_seconds = clock()

        workspace = arcpy.env.workspace
        arcpy.env.workspace = self.destination_workspace

        self.log.info('creating statewide parcel layer %s', self.destination_fc_name)
        self._create_destination_table(self.destination_workspace, self.destination_fc_name)

        for crate in self._crates:
            self.log.info('appending crate %s', crate.source_name)
            arcpy.Append_management(inputs=crate.destination, target=self.destination_fc_name, schema_type='NO_TEST')

            county_name = crate.destination_name.replace('Parcels_', '')

            self.log.debug('updating field names')

            with arcpy.da.UpdateCursor(in_table=self.destination_fc_name, field_names='County') as cursor:
                for row in cursor:
                    row[0] = county_name
                    cursor.updateRow(row)

        self.log.debug('removing index')
        try:
            arcpy.RemoveIndex_management(in_table=self.destination_fc_name, index_name='webquery')
        except Exception as e:
            self.log.warn('error removing parcel index: %s', e.message)

        self.log.debug('adding index')
        try:
            arcpy.AddIndex_management(in_table=self.destination_fc_name, fields='PARCEL_ID;County', index_name='webquery')
        except Exception as e:
            self.log.warn('error adding parcel index: %s', e.message)

        self.log.debug('compacting %s', self.temporary_workspace)
        arcpy.Compact_management(self.temporary_workspace)

        arcpy.env.workspace = workspace

        self.log.debug('finished parcel processing %s', seat.format_time(clock() - start_seconds))

    def _create_workspace(self, workspace):
        if exists(workspace):
            return

        gdb_name = basename(workspace)
        workspace = workspace.replace(gdb_name, '')

        arcpy.CreateFileGDB_management(workspace, gdb_name, 'CURRENT')

    def _create_destination_table(self, workspace, name):
        env = arcpy.env
        arcpy.env.workspace = workspace

        if arcpy.Exists(name):
            arcpy.TruncateTable_management(name)
            return

        arcpy.CreateFeatureclass_management(out_path=workspace, out_name=name, geometry_type='POLYGON')

        for field in self._fields:
            if len(field) == 5:
                arcpy.AddField_management(in_table=name,
                                          field_name=field[0],
                                          field_alias=field[1],
                                          field_type=field[2],
                                          field_is_nullable=field[3],
                                          field_length=field[4])
            else:
                arcpy.AddField_management(in_table=name, field_name=field[0], field_alias=field[1], field_type=field[2], field_is_nullable=field[3])

        arcpy.env = env

    def ship(self):
        emails = ['The parcels were just updated bro. Rejoice.', 'It\'s your lucky day. The parcels data has been updated!',
                  'Yo, the parcel app has fresh data.', 'Thanks for all your hard work. The parcel app has current data.',
                  'You updated the parcels, so I updated the parcel app data!']

        self.send_email('rkelson@utah.gov', 'Parcels', choice(emails))
