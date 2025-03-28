import { Dialog, Modal, Select, SelectItem, Sherlock } from '@ugrc/utah-design-system';
import { useOpenClosed } from '@ugrc/utilities/hooks';
import startCase from 'lodash.startcase';
import { useEffect, useState } from 'react';
import { Heading } from 'react-aria-components';

const counties = [
  'Beaver',
  'Box Elder',
  'Cache',
  'Carbon',
  'Daggett',
  'Davis',
  'Duchesne',
  'Emery',
  'Garfield',
  'Grand',
  'Iron',
  'Juab',
  'Kane',
  'Millard',
  'Morgan',
  'Piute',
  'Rich',
  'Salt Lake',
  'San Juan',
  'Sanpete',
  'Sevier',
  'Summit',
  'Tooele',
  'Uintah',
  'Utah',
  'Wasatch',
  'Washington',
  'Wayne',
  'Weber',
];
const intl = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });

export function ParcelTypeAhead({ county = '', onSuccess }) {
  const [selectedCounty, setSelectedCounty] = useState(county);
  const [layerName, setLayerName] = useState();

  useEffect(() => {
    setSelectedCounty(county);
  }, [county]);

  useEffect(() => {
    if (selectedCounty) {
      setLayerName(`cadastre.${selectedCounty.toLowerCase().replace(' ', '_')}_county_parcels`);
    }
  }, [selectedCounty]);

  return (
    <section className="w-full">
      <div className="text-lg font-semibold">Find a parcel</div>
      <Select>
        {counties.map((county) => (
          <SelectItem key={county}> {county}</SelectItem>
        ))}
      </Select>
      {selectedCounty && <Sherlock onSuccess={onSuccess} label="Parcel Number" layer={layerName} field="parcel_id" />}
    </section>
  );
}

export function Disclaimer() {
  let [isOpen, { close }] = useOpenClosed(true);

  return (
    <Modal
      show={isOpen}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Dialog className="fixed inset-0 z-10 overflow-y-auto" onClose={close}>
        <div className="min-h-screen px-4 text-center">
          <Heading slot="title">Disclaimer</Heading>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-gray-500">
              No warranties or certification, express or implied, are provided for the statewide tax parcel dataset and
              related GIS mapping layer. This data product has been compiled as a best effort service strictly for
              general purpose informational use and any interpretations made are the responsibility of the User.
            </p>
            <p className="text-sm text-gray-500">
              The State of Utah and County Governments, their elected officials, officers, employees, and agents assume
              no legal responsibilities for the information contained herein and shall have no liability for any
              damages, losses, costs, or expenses, including, but not limited to attorney&apos;s fees, arising from the
              use or misuses of the information provided herein. The User&apos;s use thereof shall constitute an
              agreement by the User to release The State of Utah and County Government, its elected officials, officers,
              employees, and agents from such liability.
            </p>
            <p className="text-sm text-gray-500">
              By using the information contained herein, the User is stating that the above Disclaimer has been read and
              that he/she has full understanding and is in agreement with the contents of this disclaimer. While the
              property boundary information depicted in this dataset is based directly on the legal descriptions
              provided on recorded documents on file in County Recorders’ Offices, it is NOT intended to be used for
              legal litigation or boundary disputes and is for informational use only. Users interested in pursuing
              legal litigation and/or boundary disputes should consult an attorney or licensed surveyor, or both.
            </p>
          </div>
          <div className="mt-4 text-right">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={close}
            >
              I agree
            </button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

export function ParcelInformation({ feature }) {
  let [{ close, open }] = useOpenClosed(false);

  useEffect(() => {
    if (feature !== undefined) {
      open();
    }
  }, [feature, open]);

  const countyName = feature?.attributes?.County ? startCase(feature.attributes.County) : null;

  return (
    <Dialog as="section" className="absolute inset-x-0 bottom-0 z-20 w-full" onClose={close}>
      <div className="flex w-full transform overflow-hidden bg-gray-900/95 px-6 py-3 text-left align-middle text-white transition-all">
        <div className="mt-4 text-right">
          <button
            type="button"
            className="absolute right-2 top-2 rounded border border-white bg-gray-800 px-1 text-white hover:bg-gray-50 hover:text-red-800 focus:outline-none"
            onClick={close}
          >
            <span aria-hidden="true" role="presentation" className="esri-icon-close h-4 w-4"></span>
            <span className="esri-icon-font-fallback-text">Close</span>
          </button>
        </div>
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
          {feature?.attributes ? (
            <>
              <IdentifyItem label="Parcel Number" text={feature.attributes.PARCEL_ID} />
              <IdentifyItem label="Address" text={feature.attributes.PARCEL_ADD} />
              <IdentifyItem label="City" text={feature.attributes.PARCEL_CITY} />
              <IdentifyItem label="Zip Code" text={feature.attributes.PARCEL_ZIP} />
              <IdentifyItem label="County" text={countyName} />
              <IdentifyItem label="Generalized Ownership Type" text={feature.attributes.OWN_TYPE} />
              <IdentifyItem label="Current as of" text={intl.format(feature.attributes.ParcelsCur)} />
              <IdentifyItem label="Notes" text={feature.attributes.ParcelNotes} />
              <IdentifyItem label="Account Number" text={feature.attributes.ACCOUNT_NUM} />
              {feature.attributes.CoParcel_URL && (
                <a
                  className="flex flex-row items-center space-x-2 text-lg font-bold text-blue-300 active:text-blue-500 hover:text-blue-100"
                  href={feature.attributes.CoParcel_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden="true" role="presentation" className="esri-icon-link-external h-5 w-5"></span>
                  <span className="esri-icon-font-fallback-text">Toggle full screen</span>
                  <span>{countyName} Website</span>
                </a>
              )}
            </>
          ) : (
            <div className="col-span-8 text-center text-xl md:text-3xl">There is no parcel information here.</div>
          )}
        </div>
      </div>
      <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-9">
        {feature?.attributes ? (
          <>
            <IdentifyItem label="Parcel Number" text={feature.attributes.PARCEL_ID} />
            <IdentifyItem label="Address" text={feature.attributes.PARCEL_ADD} />
            <IdentifyItem label="City" text={feature.attributes.PARCEL_CITY} />
            <IdentifyItem label="Zip Code" text={feature.attributes.PARCEL_ZIP} />
            <IdentifyItem label="County" text={countyName} />
            <IdentifyItem label="Generalized Ownership Type" text={feature.attributes.OWN_TYPE} />
            <IdentifyItem label="Current as of" text={intl.format(feature.attributes.ParcelsCur)} />
            <IdentifyItem label="Notes" text={feature.attributes.ParcelNotes} />
            {feature.attributes.CoParcel_URL && (
              <a
                className="flex flex-row items-center space-x-2 text-lg font-bold text-blue-300 active:text-blue-500 hover:text-blue-100"
                href={feature.attributes.CoParcel_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden="true" role="presentation" className="esri-icon-link-external h-5 w-5"></span>
                <span className="esri-icon-font-fallback-text">Toggle full screen</span>
                <span>{countyName} Website</span>
              </a>
            )}
          </>
        ) : (
          <div className="col-span-8 text-center text-xl md:text-3xl">There is no parcel information here.</div>
        )}
      </div>
    </Dialog>
  );
}

function IdentifyItem({ text, label }) {
  return (
    <div>
      <h4 className="text-lg font-bold">{label}</h4>
      <p className="text-gray-300">{text}</p>
    </div>
  );
}
