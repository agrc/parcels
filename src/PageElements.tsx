import { Dialog, ExternalLink, Modal, Select, SelectItem, Sherlock, ugrcApiProvider } from '@ugrc/utah-design-system';
import startCase from 'lodash.startcase';
import { useEffect, useState } from 'react';
import { Heading, type Key } from 'react-aria-components';

const counties = [
  { id: 1, name: 'Beaver' },
  { id: 2, name: 'Box Elder' },
  { id: 3, name: 'Cache' },
  { id: 4, name: 'Carbon' },
  { id: 5, name: 'Daggett' },
  { id: 6, name: 'Davis' },
  { id: 7, name: 'Duchesne' },
  { id: 8, name: 'Emery' },
  { id: 9, name: 'Garfield' },
  { id: 10, name: 'Grand' },
  { id: 11, name: 'Iron' },
  { id: 12, name: 'Juab' },
  { id: 13, name: 'Kane' },
  { id: 14, name: 'Millard' },
  { id: 15, name: 'Morgan' },
  { id: 16, name: 'Piute' },
  { id: 17, name: 'Rich' },
  { id: 18, name: 'Salt Lake' },
  { id: 19, name: 'San Juan' },
  { id: 20, name: 'Sanpete' },
  { id: 21, name: 'Sevier' },
  { id: 22, name: 'Summit' },
  { id: 23, name: 'Tooele' },
  { id: 24, name: 'Uintah' },
  { id: 25, name: 'Utah' },
  { id: 26, name: 'Wasatch' },
  { id: 27, name: 'Washington' },
  { id: 28, name: 'Wayne' },
  { id: 29, name: 'Weber' },
];
const intl = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });

export function ParcelTypeAhead({
  county,
  placeholder = 'Start by choosing a county',
  onSuccess = () => {},
}: {
  onSuccess: (feature: __esri.Graphic[]) => void;
  county?: Key;
  placeholder?: string;
}) {
  const [selectedCounty, setSelectedCounty] = useState<Key | undefined>(county);
  const [layerName, setLayerName] = useState<string | null>(null);

  useEffect(() => {
    if (county) {
      setSelectedCounty(county);
    }
  }, [county]);

  useEffect(() => {
    if (selectedCounty) {
      setLayerName(`cadastre.${String(selectedCounty).toLowerCase().replace(' ', '_')}_county_parcels`);
    }
  }, [selectedCounty]);

  return (
    <section className="grid w-full gap-4">
      <Select
        label="Find a parcel"
        placeholder={placeholder}
        onSelectionChange={setSelectedCounty}
        selectedKey={selectedCounty}
      >
        {counties.map((county) => (
          <SelectItem key={county.id} id={county.name} textValue={county.name}>
            {county.name}
          </SelectItem>
        ))}
      </Select>
      {selectedCounty && (
        <Sherlock
          onSherlockMatch={onSuccess}
          label={`${selectedCounty} Parcel Number`}
          provider={ugrcApiProvider(import.meta.env.VITE_UGRC_API, layerName ?? '', 'parcel_id', '', {
            wkid: 3857,
          })}
        />
      )}
    </section>
  );
}

export function Disclaimer() {
  return (
    <Modal defaultOpen={true}>
      <Dialog className="fixed inset-0 z-10 overflow-y-auto">
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

export function ParcelInformation({ feature }: { feature: __esri.Graphic | nullish }) {
  const countyName = feature?.attributes?.County ? startCase(feature.attributes.County) : null;

  //sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-9
  return (
    <div className="@container pt-4">
      <div className="@sm:grid-cols-2 @sm:gap-4 @3xl:grid-cols-3 @6xl:grid-cols-5 @3xl:gap-10 grid w-full grid-cols-1 gap-2">
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
              <div className="flex flex-row items-center space-x-2 text-lg font-bold">
                <ExternalLink href={feature.attributes.CoParcel_URL}>
                  <span>{countyName} Website</span>
                </ExternalLink>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-8 text-center text-xl md:text-3xl">
            UGRC has no parcel information for this location.
          </div>
        )}
      </div>
    </div>
  );
}

function IdentifyItem({ text, label }: { text: string | nullish; label: string }) {
  text = text?.trim();
  if (!text) {
    text = '-';
  }

  return (
    <div>
      <h4 className="text-sm font-normal uppercase">{label}</h4>
      <p className="font-bold">{text}</p>
    </div>
  );
}
