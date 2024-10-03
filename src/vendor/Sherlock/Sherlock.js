import { useCombobox } from "downshift";
import { useState } from "react";
import debounce from "lodash.debounce";
const initialValue = {
  items: [],
  limitExceeded: false,
};
const useSherlock = ({ provider, onSelect, maxResults = 10 }) => {
  // TODO: validate provider
  const [{ items, limitExceeded }, setState] = useState(initialValue);
  const [status, setStatus] = useState("idle");

  const search = debounce(({ inputValue, type }) => {
    inputValue = inputValue.trim();

    if (inputValue.length <= 2) {
      setState(initialValue);
      return;
    }

    if (
      type === useCombobox.stateChangeTypes.ItemClick ||
      type === useCombobox.stateChangeTypes.InputKeyDownEnter
    ) {
      return;
    }

    provider
      .search(inputValue, maxResults)
      .then((result) => {
        setStatus("complete");
        setState(result);
      })
      .catch(() => setStatus("error"));
  }, 300);
  const downshiftProps = useCombobox({
    items,
    itemToString: provider.itemToString.bind(provider),
    onInputValueChange: (event) => {
      setStatus("pending");
      search(event);
    },
    onSelectedItemChange: ({ selectedItem }) => {
      provider.getFeature(selectedItem).then(onSelect);
    },
  });

  return {
    downshift: downshiftProps,
    items,
    itemToString: provider.itemToString.bind(provider),
    limitExceeded,
    maxResults,
    status,
  };
};

export default useSherlock;
