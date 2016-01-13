#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Update.py
----------------------------------
the module to update parcel data into one feature class
'''

from os.path import exists, join
import arcpy


class ScheduledUpdate(object):
    expires_in_hours = 24
    source_location = 'SGID10.sde'
    output_directory = 'C:\\MapData\\'
    gdb_name = 'SGID10.gdb'
    dependencies = []

    def nightly(arg, self):
        raise NotImplementedError('Implement nightly in your update script.')

    def get_dependent_layers(self, arg):
        return self.dependencies

    def get_source_location(self):
        return join(self.output_directory, self.source_location)

    def get_destination_location(self):
        return join(self.output_directory, self.gdb_name)


class ParcelAppUpdate(ScheduledUpdate):
    expires_in_hours = 'First Tuesday of Month'
    gdb_name = 'Transformed.gdb'
    _fc_name = 'StateWideParcels'
    dependencies = [
        'Parcels_Beaver',
        'Parcels_BoxElder',
        'Parcels_Cache',
        'Parcels_Carbon',
        'Parcels_Daggett',
        'Parcels_Davis',
        'Parcels_Duchesne',
        'Parcels_Emery',
        'Parcels_Garfield',
        'Parcels_Grand',
        'Parcels_Iron',
        'Parcels_Juab',
        'Parcels_Kane',
        'Parcels_Millard',
        'Parcels_Morgan',
        'Parcels_Piute',
        'Parcels_Rich',
        'Parcels_SaltLake',
        'Parcels_SanJuan',
        'Parcels_Sanpete',
        'Parcels_Sevier',
        'Parcels_Summit',
        'Parcels_Tooele',
        'Parcels_Uintah',
        'Parcels_Utah',
        'Parcels_Wasatch',
        'Parcels_Washington',
        'Parcels_Wayne',
        'Parcels_Weber'
    ]
    _fields = [
        ['PARCEL_ID', 'Id', 'TEXT', 'NULLABLE', 50],
        ['PARCEL_ADD', 'Address', 'TEXT', 'NULLABLE', 60],
        ['PARCEL_CITY', 'City', 'TEXT', 'NULLABLE', 30],
        ['PARCEL_ZIP', 'Zip Code', 'TEXT', 'NULLABLE', 10],
        ['OWN_TYPE', 'Ownership', 'TEXT', 'NULLABLE', 20],
        ['RECORDER', 'Recorder Contact', 'TEXT', 'NULLABLE', 50],
        ['ParcelsCur', 'Current as of', 'DATE', 'NULLABLE'],
        ['ParcelNotes', 'Notes', 'TEXT', 'NULLABLE', 50],
        ['County', 'County', 'TEXT', 'NON_NULLABLE', 50]
    ]

    def nightly(self, arg):
        #: import 29 dependent layers from `source_location` to `output_location`
        #: or look through dependencies for alternate `source_location`

        self._create_output_location()

        self._create_output_table()

    def transform(self, arg):
        #: squash 29 county layers into 1 with 9 attributes used by the app
        workspace = arcpy.env.workspace
        arcpy.env.workspace = 'C:\\Projects\\GitHub\\Parcels\\data\\SGID10.gdb'

        arcpy.TruncateTable_management(in_table=join(self._get_tranform_location(), self._fc_name))

        for layer in self.dependencies:
            arcpy.Append_management(inputs=layer,
                                    target=join(self._get_tranform_location(), self._fc_name),
                                    schema_type='NO_TEST')

            county_name = layer.replace('Parcels_', '')

            with arcpy.da.UpdateCursor(in_table=join(self._get_tranform_location(), self._fc_name),
                                       field_names='County',
                                       where_clause='County IS NULL OR County = \'\'') as cursor:
                for row in cursor:
                    row[0] = county_name
                    cursor.updateRow(row)

        arcpy.env.workspace = workspace

        try:
            arcpy.RemoveIndex_management(in_table=join(self._get_tranform_location(), self._fc_name),
                                         index_name='web_query')
        except Exception:
            pass

        arcpy.AddIndex_management(in_table=join(self._get_tranform_location(), self._fc_name),
                                  fields='PARCEL_ID;County',
                                  index_name='web_query')

    def clean_up(self, arg):
        #: delete parcel data if not used in other plugin
        pass

    def _create_output_location(self):
        if exists(self.get_destination_location()):
            return

        arcpy.CreateFileGDB_management(self.output_directory,
                                       self.gdb_name,
                                       'CURRENT')

    def _create_output_table(self):
        workspace = arcpy.env.workspace
        arcpy.env.workspace = self._get_tranform_location()

        if arcpy.Exists(self._fc_name):
            return

        sr = join(self.output_directory, '3857.prj')
        arcpy.CreateFeatureclass_management(out_path=self._get_tranform_location(),
                                            out_name=self._fc_name,
                                            geometry_type='POLYGON',
                                            spatial_reference=sr)

        for field in self._fields:
            if len(field) == 5:
                arcpy.AddField_management(in_table=self._fc_name,
                                          field_name=field[0],
                                          field_alias=field[1],
                                          field_type=field[2],
                                          field_is_nullable=field[3],
                                          field_length=field[4])
            else:
                arcpy.AddField_management(in_table=self._fc_name,
                                          field_name=field[0],
                                          field_alias=field[1],
                                          field_type=field[2],
                                          field_is_nullable=field[3])

        arcpy.env.workspace = workspace

    def _get_tranform_location(self):
        return join(self.output_directory, self.gdb_name)
